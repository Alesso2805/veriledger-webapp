import { AxiosError, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { findBlockNumber, findHash, getBlock, getBlocks, getPendingTransactions, getTransaction, mineBlock, sendTransaction } from './ledger';

const block = {
  id: 'b1',
  block_number: 3,
  previous_hash: '0000aa',
  timestamp: '2026-10-21T10:00:00Z',
  nonce: 4210,
  block_hash: '0000bb',
  transaction_ids: ['t1'],
  transaction_hashes: ['h1'],
};
const indexHtml = '<!doctype html><html></html>';

describe('ledger endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getBlocks asks for one page of blocks', async () => {
    const page = { items: [block], total: 4, page: 1, size: 10 };
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: page });

    await expect(getBlocks(0, 10)).resolves.toEqual(page);
    expect(get).toHaveBeenCalledWith('/blocks', { params: { skip: 0, limit: 10 } });
  });

  it('getBlocks rejects a 200 that is not the API, such as index.html from the static server', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: indexHtml });

    await expect(getBlocks(0, 10)).rejects.toThrow('The API did not answer /blocks');
  });

  it('getBlock reads one block by its hash, escaped for the path', async () => {
    const full = { ...block, transactions: [] };
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: full });

    await expect(getBlock('0000bb')).resolves.toEqual(full);
    await getBlock('a/b');
    expect(get.mock.calls.map(([url]) => url)).toEqual(['/blocks/0000bb', '/blocks/a%2Fb']);
  });

  it('getBlock rejects an answer without a block hash', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: indexHtml });

    await expect(getBlock('0000bb')).rejects.toThrow('did not answer');
  });

  it('getTransaction reads one transaction by its hash, escaped for the path', async () => {
    const transaction = { id: 't1', tx_hash: 'h1', status: 'CONFIRMED', block_number: 3 };
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: transaction });

    await expect(getTransaction('h1')).resolves.toEqual(transaction);
    await getTransaction('a/b');
    expect(get.mock.calls.map(([url]) => url)).toEqual(['/transactions/h1', '/transactions/a%2Fb']);
  });

  it('getTransaction rejects an answer without a transaction hash', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: indexHtml });

    await expect(getTransaction('h1')).rejects.toThrow('The API did not answer /transactions/{tx_hash}');
  });

  describe('search', () => {
    const notFound = () =>
      new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, null, { status: 404, data: { detail: 'Not found' } } as AxiosResponse);
    const hash = 'ab'.repeat(32);

    it('findHash finds a block by its hash, and a transaction it is not', async () => {
      vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
        if (url.startsWith('/blocks/')) return { data: { ...block, block_hash: hash, transactions: [] } };
        throw notFound();
      });

      await expect(findHash(hash)).resolves.toEqual([{ kind: 'block', number: 3, hash }]);
    });

    it('findHash finds a transaction by its hash', async () => {
      const transaction = { id: 't1', tx_hash: hash, status: 'PENDING' };
      vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
        if (url.startsWith('/transactions/')) return { data: transaction };
        throw notFound();
      });

      await expect(findHash(hash)).resolves.toEqual([{ kind: 'transaction', transaction }]);
    });

    it('findHash answers nothing for a hash neither has, and fails only when the node does', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(notFound());
      await expect(findHash(hash)).resolves.toEqual([]);

      vi.spyOn(api, 'get').mockRejectedValue(new Error('Network Error'));
      await expect(findHash(hash)).rejects.toThrow('Network Error');
    });

    it('findBlockNumber reads block n, and nothing above the top', async () => {
      const get = vi.spyOn(api, 'get').mockImplementation(async (_url, config) => {
        const skip = (config?.params as { skip: number } | undefined)?.skip ?? 0;
        return { data: { items: [{ ...block, block_number: 9 - skip, block_hash: 'h' }], total: 10, page: 1, size: 1 } };
      });

      await expect(findBlockNumber(7)).resolves.toEqual([{ kind: 'block', number: 7, hash: 'h' }]);
      expect(get).toHaveBeenLastCalledWith('/blocks', { params: { skip: 2, limit: 1 } });
      await expect(findBlockNumber(12)).resolves.toEqual([]);
    });
  });

  it('getPendingTransactions reads the mempool', async () => {
    const page = { items: [], total: 0, page: 1, size: 10 };
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: page });

    await expect(getPendingTransactions(0, 10)).resolves.toEqual(page);
    expect(get).toHaveBeenCalledWith('/transactions', { params: { status: 'PENDING', skip: 0, limit: 10 } });
  });

  it('getPendingTransactions rejects a page without items', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { total: 0 } });

    await expect(getPendingTransactions(0, 10)).rejects.toThrow('The API did not answer /transactions');
  });

  it('sendTransaction posts the signed fields with the signature, and returns what the node recorded', async () => {
    const fields = { sender_address: 'aa', receiver_address: 'bb', amount: '1.00000000', fee: '0.00000000', nonce: 1 };
    const recorded = { id: 't1', tx_hash: 'h1', status: 'PENDING' };
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: recorded });

    await expect(sendTransaction(fields, 'sig')).resolves.toEqual(recorded);
    expect(post).toHaveBeenCalledWith('/transactions', { ...fields, signature: 'sig' });
  });

  it('sendTransaction rejects an answer without a transaction hash', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: indexHtml });
    const fields = { sender_address: 'aa', receiver_address: 'bb', amount: '1.00000000', fee: '0.00000000', nonce: 1 };

    await expect(sendTransaction(fields, 'sig')).rejects.toThrow('The API did not answer /transactions');
  });

  it('mineBlock sends the reward address and returns the sealed block', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: block });

    await expect(mineBlock('cafe')).resolves.toEqual(block);
    expect(post).toHaveBeenCalledWith('/blocks/mine', { miner_address: 'cafe' });
  });

  it('mineBlock passes a refusal on unchanged, so the page can show its detail', async () => {
    const refusal = new Error('Request failed with status code 400');
    vi.spyOn(api, 'post').mockRejectedValue(refusal);

    await expect(mineBlock('cafe')).rejects.toBe(refusal);
  });
});
