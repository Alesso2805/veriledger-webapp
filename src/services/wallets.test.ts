import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { getBalance, getNextNonce, getWalletTransactions } from './wallets';

describe('wallet endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getWalletTransactions reads one page of the address's activity", async () => {
    const page = { items: [], total: 0, page: 1, size: 20 };
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: page });

    await expect(getWalletTransactions('ab', 0, 20)).resolves.toEqual(page);
    expect(get).toHaveBeenCalledWith('/wallets/ab/transactions', { params: { skip: 0, limit: 20 } });
  });

  it('getWalletTransactions rejects an answer that is not a page, such as index.html', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: '<!doctype html><html></html>' });

    await expect(getWalletTransactions('ab', 0, 20)).rejects.toThrow('The API did not answer /wallets/{address}/transactions');
  });

  it("getBalance reads the address's balance", async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { address: 'ab', balance: 50.1 } });

    await expect(getBalance('ab')).resolves.toBe(50.1);
    expect(get).toHaveBeenCalledWith('/wallets/ab/balance');
  });

  it('getBalance rejects an answer without a numeric balance, such as index.html', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: '<!doctype html><html></html>' });

    await expect(getBalance('ab')).rejects.toThrow('The API did not answer /wallets/{address}/balance');
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
