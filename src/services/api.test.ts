import { AxiosError, type AxiosAdapter, type AxiosResponse } from 'axios';
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

// A custom adapter has to reject a failed status itself, as axios's own adapters do.
const answering = (status: number): AxiosAdapter => async (config) => {
  const response = { data: { detail: 'x' }, status, statusText: '', headers: {}, config } as AxiosResponse;
  throw new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, null, response);
};

async function sentAuthorization() {
  const response = await api.get('/anything', { adapter: echo });
  return response.config.headers.Authorization;
}

describe('api client', () => {
  beforeEach(() => {
    useAppStore.setState({ token: null, endedReason: null });
  });

  it('ends the session when the API answers 401 to a request that carried it', async () => {
    useAppStore.setState({ token: 'abc.def.ghi' });

    await expect(api.get('/auth/me', { adapter: answering(401) })).rejects.toThrow('401');

    expect(useAppStore.getState()).toMatchObject({ token: null, endedReason: 'expired' });
  });

  it('leaves a 401 without a session alone, such as a wrong password at sign-in', async () => {
    await expect(api.post('/auth/login', {}, { adapter: answering(401) })).rejects.toThrow('401');

    expect(useAppStore.getState().endedReason).toBeNull();
  });

  it('keeps the session on other errors', async () => {
    useAppStore.setState({ token: 'abc.def.ghi' });

    await expect(api.get('/blocks', { adapter: answering(500) })).rejects.toThrow('500');

    expect(useAppStore.getState().token).toBe('abc.def.ghi');
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
