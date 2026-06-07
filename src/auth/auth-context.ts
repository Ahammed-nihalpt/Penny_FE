import { createContext } from 'react';
import type { AuthUser } from '@/lib/types';

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signup: (data: { name: string; email: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
