import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { getMe } from './auth';
import { getHealth } from './health';

describe('session endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getMe reads the signed-in user from /auth/me', async () => {
    const user = { id: '1', email: 'a@veriledger.test', role: 'trader', created_at: '', updated_at: '' };
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: user });

    await expect(getMe()).resolves.toEqual(user);
    expect(get).toHaveBeenCalledWith('/auth/me');
  });

  it('getHealth reads /health', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { status: 'ok', environment: 'test' } });

    await expect(getHealth()).resolves.toEqual({ status: 'ok', environment: 'test' });
    expect(get).toHaveBeenCalledWith('/health');
  });

  it('getHealth rejects when the API does not answer', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('Network Error'));

    await expect(getHealth()).rejects.toThrow('Network Error');
  });
});
