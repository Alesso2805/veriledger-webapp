import type { AxiosAdapter } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import { api } from './api';

// Answers in-process so the test sees the headers the interceptors produced without touching the network.
const echo: AxiosAdapter = async (config) => ({
  data: null,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

async function sentAuthorization() {
  const response = await api.get('/anything', { adapter: echo });
  return response.config.headers.Authorization;
}

describe('api client', () => {
  beforeEach(() => {
    useAppStore.setState({ token: null });
  });

  it('sends the session token as a bearer token', async () => {
    useAppStore.setState({ token: 'abc.def.ghi' });

    expect(await sentAuthorization()).toBe('Bearer abc.def.ghi');
  });

  it('sends no Authorization header without a session', async () => {
    expect(await sentAuthorization()).toBeUndefined();
  });

  it('reads the token on every request, so a new sign-in applies to the next one', async () => {
    useAppStore.setState({ token: 'first' });
    await sentAuthorization();
    useAppStore.setState({ token: 'second' });

    expect(await sentAuthorization()).toBe('Bearer second');
  });
});
