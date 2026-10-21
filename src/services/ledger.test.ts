import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { getBlock, getBlocks, getPendingTransactions, mineBlock } from './ledger';

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
