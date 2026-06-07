import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, setAccessToken } from '@/lib/api';
import type { AuthUser, TokenResponse } from '@/lib/types';
import { AuthContext } from '@/auth/auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const { data } = await api.get<AuthUser>('/auth/me');
    setUser(data);
  }, []);

  const finishAuth = useCallback(
    async (accessToken: string) => {
      setAccessToken(accessToken);
      await loadMe();
    },
    [loadMe],
  );

  // Silent refresh on first load: if the cookie is valid, restore the session.
  useEffect(() => {
    const restore = async () => {
      try {
        const { data } = await api.post<TokenResponse>('/auth/refresh');
        await finishAuth(data.accessToken);
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };
    void restore();
  }, [finishAuth]);

  const signup = useCallback(
    async (body: { name: string; email: string; password: string }) => {
      const { data } = await api.post<TokenResponse>('/auth/signup', body);
      await finishAuth(data.accessToken);
    },
    [finishAuth],
  );

  const login = useCallback(
    async (body: { email: string; password: string }) => {
      const { data } = await api.post<TokenResponse>('/auth/login', body);
      await finishAuth(data.accessToken);
    },
    [finishAuth],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const { data } = await api.post<TokenResponse>('/auth/google', { idToken });
      await finishAuth(data.accessToken);
    },
    [finishAuth],
  );

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signup, login, loginWithGoogle, logout }),
    [user, loading, signup, login, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
