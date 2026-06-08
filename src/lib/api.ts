import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const api = axios.create({ baseURL, withCredentials: true });

// Access token lives in memory only (set by AuthContext). Not localStorage → XSS-safe.
let accessToken: string | null = null;
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
export const getAccessToken = (): string | null => accessToken;

// Exported for unit testing; attaches the bearer header when a token is set.
export function attachAuthHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}

api.interceptors.request.use(attachAuthHeader);

// On 401, try ONE silent refresh (cookie), then retry the original request once.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;
    const isAuthCall = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  },
);
