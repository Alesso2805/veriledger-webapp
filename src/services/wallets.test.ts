import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { getNextNonce } from './wallets';

describe('wallet endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getNextNonce reads the sender's next nonce", async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { address: 'ab/cd', nonce: 3 } });

    await expect(getNextNonce('ab/cd')).resolves.toBe(3);
    expect(get).toHaveBeenCalledWith('/wallets/ab%2Fcd/nonce');
  });

  it.each([
    ['index.html from the static server', '<!doctype html><html></html>'],
    ['a nonce as a string', { nonce: '3' }],
    ['a nonce below 1', { nonce: 0 }],
  ])('getNextNonce rejects %s', async (_case, data) => {
    vi.spyOn(api, 'get').mockResolvedValue({ data });

    await expect(getNextNonce('ab')).rejects.toThrow('The API did not answer /wallets/{address}/nonce');
  });
});
