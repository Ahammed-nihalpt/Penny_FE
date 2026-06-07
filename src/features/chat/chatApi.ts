import { api } from '@/lib/api';
import type { ChatMessage, ChatSession, SendResponse } from '@/features/chat/types';

export const chatApi = {
  listSessions: () => api.get<ChatSession[]>('/chat/sessions').then((r) => r.data),
  createSession: () => api.post<ChatSession>('/chat/sessions').then((r) => r.data),
  getMessages: (id: string) =>
    api.get<ChatMessage[]>(`/chat/sessions/${id}/messages`).then((r) => r.data),
  send: (id: string, content: string, signal?: AbortSignal) =>
    api
      .post<SendResponse>(`/chat/sessions/${id}/messages`, { content }, { signal })
      .then((r) => r.data),
  remove: (id: string) => api.delete(`/chat/sessions/${id}`).then((r) => r.data),
};
