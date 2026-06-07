import { create } from 'zustand';
import { chatApi } from '@/features/chat/chatApi';
import type { ChatMessage, ChatSession } from '@/features/chat/types';

interface ChatStore {
  sessions: ChatSession[];
  activeId: string | null;
  messages: ChatMessage[];
  sending: boolean;
  lastChangedIds: string[];
  loadSessions: () => Promise<void>;
  newChat: () => Promise<void>;
  select: (id: string) => Promise<void>;
  send: (content: string) => Promise<void>;
  stop: () => void;
  remove: (id: string) => Promise<void>;
}

// Module-level so stop() can abort the in-flight request without re-rendering.
let activeController: AbortController | null = null;

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  activeId: null,
  messages: [],
  sending: false,
  lastChangedIds: [],

  loadSessions: async () => {
    const sessions = await chatApi.listSessions();
    set({ sessions });
    if (!get().activeId && sessions.length > 0) {
      await get().select(sessions[0]._id);
    }
  },

  newChat: async () => {
    const session = await chatApi.createSession();
    set((s) => ({ sessions: [session, ...s.sessions], activeId: session._id, messages: [] }));
  },

  select: async (id) => {
    set({ activeId: id, messages: [] });
    const messages = await chatApi.getMessages(id);
    set({ messages });
  },

  send: async (content) => {
    let id = get().activeId;
    if (!id) {
      const session = await chatApi.createSession();
      set((s) => ({ sessions: [session, ...s.sessions], activeId: session._id, messages: [] }));
      id = session._id;
    }
    const userMsg: ChatMessage = {
      _id: `tmp-${String(get().messages.length)}-${content.length}`,
      role: 'user',
      content,
      createdAt: '',
    };
    activeController = new AbortController();
    set((s) => ({ messages: [...s.messages, userMsg], sending: true, lastChangedIds: [] }));
    try {
      const { message, actions } = await chatApi.send(id, content, activeController.signal);
      const changed = actions.flatMap((a) => a.invoiceIds);
      set((s) => ({ messages: [...s.messages, message], lastChangedIds: changed }));
      await get().loadSessions();
    } catch {
      // Aborted (Stop) or network error — leave the user's message in place and stop.
    } finally {
      activeController = null;
      set({ sending: false });
    }
  },

  stop: () => {
    activeController?.abort();
  },

  remove: async (id) => {
    await chatApi.remove(id);
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
