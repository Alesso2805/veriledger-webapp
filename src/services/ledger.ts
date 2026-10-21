import type { SignedFields } from '../lib/signing';
import type { Block, FullBlock, Paginated, Transaction } from '../types/ledger';
import { api, statusOf } from './api';

export type Found = { kind: 'block'; number: number; hash: string } | { kind: 'transaction'; transaction: Transaction };

// Every answer is checked before a page draws it: a misrouted /api gets index.html with a 200 from the static
// server, and the old explorer went blank on it.
function asPage<T>(data: unknown, path: string): Paginated<T> {
  const page = data as Paginated<T> | undefined;
  if (!Array.isArray(page?.items) || typeof page.total !== 'number') throw new Error(`The API did not answer ${path}`);
  return page;
}

function asBlock<T extends { block_hash: string }>(data: unknown, path: string): T {
  if (typeof (data as T | undefined)?.block_hash !== 'string') throw new Error(`The API did not answer ${path}`);
  return data as T;
}

// Newest first. total counts every block, so the top of the chain is block number total - 1.
export async function getBlocks(skip: number, limit: number): Promise<Paginated<Block>> {
  const response = await api.get('/blocks', { params: { skip, limit } });
  return asPage<Block>(response.data, '/blocks');
}

export async function getBlock(blockHash: string): Promise<FullBlock> {
  const response = await api.get(`/blocks/${encodeURIComponent(blockHash)}`);
  return asBlock<FullBlock>(response.data, '/blocks/{block_hash}');
}

// One transaction by the hash its links use; a 404 means this node has no such transaction.
export async function getTransaction(txHash: string): Promise<Transaction> {
  const response = await api.get(`/transactions/${encodeURIComponent(txHash)}`);
  if (typeof (response.data as Transaction | undefined)?.tx_hash !== 'string') {
    throw new Error('The API did not answer /transactions/{tx_hash}');
  }
  return response.data as Transaction;
}

// A block hash and a transaction hash look alike, so a hash is looked up as both. Not finding it is an answer;
// only a failure of another kind, with nothing found, is an error.
export async function findHash(hash: string): Promise<Found[]> {
  const [block, transaction] = await Promise.allSettled([getBlock(hash), getTransaction(hash)]);
  const found: Found[] = [];
  if (block.status === 'fulfilled') found.push({ kind: 'block', number: block.value.block_number, hash: block.value.block_hash });
  if (transaction.status === 'fulfilled') found.push({ kind: 'transaction', transaction: transaction.value });
  const failure = [block, transaction].find(
    (result): result is PromiseRejectedResult => result.status === 'rejected' && statusOf(result.reason) !== 404,
  );
  if (found.length === 0 && failure) throw failure.reason;
  return found;
}

// Block n is the one total - 1 - n places from the newest.
export async function findBlockNumber(number: number): Promise<Found[]> {
  const top = (await getBlocks(0, 1)).items[0]?.block_number;
  if (top === undefined || number > top) return [];
  const block = (await getBlocks(top - number, 1)).items[0];
  return block?.block_number === number ? [{ kind: 'block', number, hash: block.block_hash }] : [];
}

// The mempool, newest first; the API takes 1 to 100 per page.
export async function getPendingTransactions(skip: number, limit: number): Promise<Paginated<Transaction>> {
  const response = await api.get('/transactions', { params: { status: 'PENDING', skip, limit } });
  return asPage<Transaction>(response.data, '/transactions');
}

// The fields exactly as they were signed, and the signature; never the key (AR-05). A byte-identical retry gets
// a 200 with the stored transaction, so sending again after a timeout cannot record it twice (VLA-16).
export async function sendTransaction(fields: SignedFields, signature: string): Promise<Transaction> {
  const response = await api.post('/transactions', { ...fields, signature });
  if (typeof (response.data as Transaction | undefined)?.tx_hash !== 'string') {
    throw new Error('The API did not answer /transactions');
  }
  return response.data as Transaction;
}

// The API answers once the proof of work is done, so there is no progress to show; the nonce is the response's.
export async function mineBlock(minerAddress: string): Promise<Block> {
  const response = await api.post('/blocks/mine', { miner_address: minerAddress });
  return asBlock<Block>(response.data, '/blocks/mine');
}
