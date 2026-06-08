import { create } from 'zustand';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { chatApi } from '@/features/chat/chatApi';
import type { ChatMessage, ChatSession } from '@/features/chat/types';

const notifyError = (message: string): void => {
  notifications.show({ color: 'red', message });
};

const isAbort = (err: unknown): boolean =>
  axios.isCancel(err) || (err instanceof Error && err.name === 'AbortError');
const statusOf = (err: unknown): number | undefined =>
  (err as { status?: number; response?: { status?: number } }).status ??
  (err as { response?: { status?: number } }).response?.status;

interface ChatStore {
  sessions: ChatSession[];
  activeId: string | null;
  messages: ChatMessage[];
  // The session a reply is currently being generated for (null = idle). Scoped
  // per-session so switching chats doesn't show another chat's typing state.
  sendingSessionId: string | null;
  lastChangedIds: string[];
  loadSessions: () => Promise<void>;
  newChat: () => Promise<void>;
  select: (id: string) => Promise<void>;
  send: (content: string) => Promise<void>;
  retryLast: () => void;
  stop: () => void;
  remove: (id: string) => Promise<void>;
}

// Module-level so stop() can abort the in-flight request without re-rendering.
let activeController: AbortController | null = null;

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  activeId: null,
  messages: [],
  sendingSessionId: null,
  lastChangedIds: [],

  loadSessions: async () => {
    try {
      const sessions = await chatApi.listSessions();
      set({ sessions });
      if (!get().activeId && sessions.length > 0) {
        await get().select(sessions[0]._id);
      }
    } catch {
      notifyError('Couldn’t load your chats.');
    }
  },

  newChat: async () => {
    try {
      const session = await chatApi.createSession();
      set((s) => ({ sessions: [session, ...s.sessions], activeId: session._id, messages: [] }));
    } catch {
      notifyError('Couldn’t start a new chat.');
    }
  },

  select: async (id) => {
    set({ activeId: id, messages: [] });
    try {
      const messages = await chatApi.getMessages(id);
      set({ messages });
    } catch {
      notifyError('Couldn’t open that chat.');
    }
  },

  send: async (content) => {
    let id = get().activeId;
    if (!id) {
      const session = await chatApi.createSession();
      set((s) => ({ sessions: [session, ...s.sessions], activeId: session._id, messages: [] }));
      id = session._id;
    }
    const base = get().messages.length;
    const userMsg: ChatMessage = {
      _id: `tmp-${String(base)}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    // A live placeholder that fills in token-by-token as the reply streams.
    const streamId = `stream-${String(base)}`;
    const streamMsg: ChatMessage = { _id: streamId, role: 'assistant', content: '', createdAt: '' };
    const controller = new AbortController();
    activeController = controller;
    set((s) => ({
      messages: [...s.messages, userMsg, streamMsg],
      sendingSessionId: id,
      lastChangedIds: [],
    }));

    const onToken = (t: string): void => {
      if (get().activeId !== id) return;
      set((s) => ({
        messages: s.messages.map((m) =>
          m._id === streamId ? { ...m, content: m.content + t } : m,
        ),
      }));
    };

    try {
      const { message, actions } = await chatApi.send(id, content, controller.signal, onToken);
      // Only touch the thread if the user is still viewing the session we sent to;
      // otherwise the reply is already persisted server-side and loads on return.
      if (get().activeId === id) {
        set((s) => ({
          messages: s.messages.map((m) => (m._id === streamId ? message : m)),
          lastChangedIds: actions.flatMap((a) => a.invoiceIds),
        }));
      }
      await get().loadSessions();
    } catch (err) {
      if (get().activeId === id) {
        set((s) => {
          const stream = s.messages.find((m) => m._id === streamId);
          const withoutStream = s.messages.filter((m) => m._id !== streamId);
          // Stop button (abort): keep whatever streamed so far, drop it if empty.
          if (isAbort(err)) {
            return stream && stream.content
              ? { messages: [...withoutStream, { ...stream, _id: `done-${String(base)}` }] }
              : { messages: withoutStream };
          }
          const status = statusOf(err);
          const text =
            status === 429
              ? 'Penny hit the model’s rate limit. Try again shortly, or switch models above.'
              : 'Penny couldn’t respond. Please try again.';
          return {
            messages: [
              ...withoutStream,
              {
                _id: `err-${String(base)}`,
                role: 'assistant',
                content: text,
                createdAt: '',
                error: true,
              },
            ],
          };
        });
      }
    } finally {
      if (activeController === controller) activeController = null;
      // Clear only if no newer send replaced us.
      if (get().sendingSessionId === id) set({ sendingSessionId: null });
    }
  },

  // Re-run the last user turn after a failure: drop the error bubble and the
  // failed user message, then send it again (send re-adds the user message).
  retryLast: () => {
    const msgs = [...get().messages];
    if (!msgs[msgs.length - 1]?.error) return;
    msgs.pop();
    const userMsg = msgs.pop();
    set({ messages: msgs });
    if (userMsg) void get().send(userMsg.content);
  },

  stop: () => {
    activeController?.abort();
  },

  remove: async (id) => {
    try {
      await chatApi.remove(id);
    } catch {
      notifyError('Couldn’t delete that chat.');
      return;
    }
    set((s) => {
      const sessions = s.sessions.filter((x) => x._id !== id);
      const wasActive = s.activeId === id;
      return {
        sessions,
        activeId: wasActive ? null : s.activeId,
        messages: wasActive ? [] : s.messages,
      };
    });
  },
}));
