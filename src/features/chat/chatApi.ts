import { api, baseURL, getAccessToken, setAccessToken } from '@/lib/api';
import type { ChatMessage, ChatSession, SendResponse } from '@/features/chat/types';

// POSTs the message and reads the reply as a Server-Sent Events stream:
// `token` frames stream the reply (forwarded to onToken), then a `done` frame
// carries the saved message + actions. Falls back through one 401 refresh.
async function streamSend(
  id: string,
  content: string,
  signal: AbortSignal | undefined,
  onToken: (token: string) => void,
  retried = false,
): Promise<SendResponse> {
  const token = getAccessToken();
  const res = await fetch(`${baseURL}/chat/sessions/${id}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
    signal,
  });

  if (res.status === 401 && !retried) {
    const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
    setAccessToken(data.accessToken);
    return streamSend(id, content, signal, onToken, true);
  }
  if (!res.ok || !res.body) {
    const err = new Error('Request failed') as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: SendResponse | null = null;
  let errorStatus: number | undefined;

  let finished = false;
  while (!finished) {
    const { done, value } = await reader.read();
    finished = done;
    if (value) buffer += decoder.decode(value, { stream: true });

    let sep = buffer.indexOf('\n\n');
    while (sep !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      sep = buffer.indexOf('\n\n');

      let event = 'message';
      let dataStr = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
      }
      if (!dataStr) continue;

      const parsed: unknown = JSON.parse(dataStr);
      if (event === 'token') {
        const text = (parsed as { text?: string }).text;
        if (text) onToken(text);
      } else if (event === 'done') {
        result = parsed as SendResponse;
      } else if (event === 'error') {
        errorStatus = (parsed as { status?: number }).status;
      }
    }
  }

  if (!result) {
    const err = new Error('Penny could not respond') as Error & { status?: number };
    err.status = errorStatus;
    throw err;
  }
  return result;
}

export const chatApi = {
  listSessions: () => api.get<ChatSession[]>('/chat/sessions').then((r) => r.data),
  createSession: () => api.post<ChatSession>('/chat/sessions').then((r) => r.data),
  getMessages: (id: string) =>
    api.get<ChatMessage[]>(`/chat/sessions/${id}/messages`).then((r) => r.data),
  send: (
    id: string,
    content: string,
    signal: AbortSignal | undefined,
    onToken: (t: string) => void,
  ) => streamSend(id, content, signal, onToken),
  remove: (id: string) => api.delete(`/chat/sessions/${id}`).then((r) => r.data),
};
