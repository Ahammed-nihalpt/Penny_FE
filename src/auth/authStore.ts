import { create } from 'zustand';
import { api, setAccessToken } from '@/lib/api';
import type { AuthUser, TokenResponse } from '@/lib/types';

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  init: () => Promise<void>;
  signup: (data: { name: string; email: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => {
  const loadMe = async () => {
    const { data } = await api.get<AuthUser>('/auth/me');
    set({ user: data });
  };

  const finishAuth = async (accessToken: string) => {
    setAccessToken(accessToken);
    await loadMe();
  };

  return {
    user: null,
    loading: true,

    // Silent refresh on app load: if the cookie is valid, restore the session.
    init: async () => {
      try {
        const { data } = await api.post<TokenResponse>('/auth/refresh');
        await finishAuth(data.accessToken);
      } catch {
        setAccessToken(null);
        set({ user: null });
      } finally {
        set({ loading: false });
      }
    },

    signup: async (body) => {
      const { data } = await api.post<TokenResponse>('/auth/signup', body);
      await finishAuth(data.accessToken);
    },

    login: async (body) => {
      const { data } = await api.post<TokenResponse>('/auth/login', body);
      await finishAuth(data.accessToken);
    },

    loginWithGoogle: async (idToken) => {
      const { data } = await api.post<TokenResponse>('/auth/google', { idToken });
      await finishAuth(data.accessToken);
    },

    logout: async () => {
      await api.post('/auth/logout');
      setAccessToken(null);
      set({ user: null });
    },
  };
});
