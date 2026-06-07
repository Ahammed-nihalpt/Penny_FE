import { describe, it, expect } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { attachAuthHeader, setAccessToken } from '@/lib/api';

const makeConfig = (): InternalAxiosRequestConfig =>
  ({ headers: {} }) as unknown as InternalAxiosRequestConfig;

describe('attachAuthHeader', () => {
  it('attaches a Bearer header when a token is set', () => {
    setAccessToken('tok123');
    const config = attachAuthHeader(makeConfig());
    expect(config.headers.Authorization).toBe('Bearer tok123');
    setAccessToken(null);
  });

  it('attaches no header when no token is set', () => {
    setAccessToken(null);
    const config = attachAuthHeader(makeConfig());
    expect(config.headers.Authorization).toBeUndefined();
  });
});
