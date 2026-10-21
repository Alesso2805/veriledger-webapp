import { AxiosError, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { getMe, InvalidCredentialsError, login, startDemo } from './auth';
import { DatabaseDownError, getHealth } from './health';

describe('session endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('login posts the OAuth2 form and returns the token', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { access_token: 'abc.def.ghi' } });

    await expect(login('a@veriledger.test', 'a password')).resolves.toBe('abc.def.ghi');
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('/auth/login');
    expect(String(body)).toBe('username=a%40veriledger.test&password=a+password');
    expect(config?.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
  });

  it('login turns a 401 into InvalidCredentialsError', async () => {
    const unauthorized = new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 401,
    } as unknown as AxiosResponse);
    vi.spyOn(api, 'post').mockRejectedValue(unauthorized);

    await expect(login('a@veriledger.test', 'wrong')).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('login passes other failures on unchanged', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new Error('Network Error'));

    await expect(login('a@veriledger.test', 'a password')).rejects.toThrow('Network Error');
  });

  it('getMe reads the signed-in user from /auth/me', async () => {
    const user = { id: '1', email: 'a@veriledger.test', display_name: 'a@veriledger.test', expires_at: null, role: 'trader', created_at: '', updated_at: '' };
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: user });

    await expect(getMe()).resolves.toEqual(user);
    expect(get).toHaveBeenCalledWith('/auth/me');
  });

  it('getMe rejects an answer that does not say who is signed in', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { id: '1', role: 'trader' } });

    await expect(getMe()).rejects.toThrow('did not answer /auth/me');
  });

  it('startDemo posts /auth/demo with no body and returns the token', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { access_token: 'demo.jwt.token', token_type: 'bearer' } });

    await expect(startDemo()).resolves.toBe('demo.jwt.token');
    expect(post).toHaveBeenCalledWith('/auth/demo');
  });

  it('startDemo rejects a 200 without a token', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: '<!doctype html><html></html>' });

    await expect(startDemo()).rejects.toThrow('did not answer /auth/demo');
  });

  it('getHealth reads /health', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { status: 'ok', environment: 'test' } });

    await expect(getHealth()).resolves.toEqual({ status: 'ok', environment: 'test' });
    expect(get).toHaveBeenCalledWith('/health');
  });

  it('getHealth rejects a 200 that is not the API, such as index.html from the static server', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: '<!doctype html><html></html>' });

    await expect(getHealth()).rejects.toThrow('did not answer');
  });

  it('getHealth tells a database the API cannot reach from an API it cannot reach (VLA-26)', async () => {
    const unavailable = (data: unknown) =>
      new AxiosError('Service Unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 503, data } as unknown as AxiosResponse);
    vi.spyOn(api, 'get').mockRejectedValueOnce(
      unavailable({ status: 'unavailable', environment: 'test', demo_mode: false, database: 'unreachable' }),
    );
    await expect(getHealth()).rejects.toBeInstanceOf(DatabaseDownError);

    // A 503 from something in front of the API is not the API speaking about its database.
    vi.spyOn(api, 'get').mockRejectedValueOnce(unavailable('<html>Service Unavailable</html>'));
    await expect(getHealth()).rejects.not.toBeInstanceOf(DatabaseDownError);
  });

  it('getHealth rejects when the API does not answer', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('Network Error'));

    await expect(getHealth()).rejects.toThrow('Network Error');
  });
});
