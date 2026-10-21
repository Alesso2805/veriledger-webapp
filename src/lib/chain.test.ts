import { describe, expect, it } from 'vitest';
import type { Block, Transaction } from '../types/ledger';
import { mergeBlocks, rewardFirst } from './chain';

const block = (number: number, hash = `h${number}`): Block => ({
  id: `b${number}`,
  block_number: number,
  previous_hash: `h${number - 1}`,
  timestamp: '2026-10-21T10:00:00Z',
  nonce: 1,
  block_hash: hash,
  transaction_ids: [],
  transaction_hashes: [],
});
const numbers = (blocks: Block[]) => blocks.map((b) => b.block_number);

describe('mergeBlocks', () => {
  it('adds an older page below what was loaded', () => {
    expect(numbers(mergeBlocks([block(5), block(4)], [block(3), block(2)], false))).toEqual([5, 4, 3, 2]);
  });

  it('puts new blocks on top and keeps the older ones', () => {
    const merged = mergeBlocks([block(3), block(2), block(1)], [block(4), block(3)], true);
    expect(numbers(merged)).toEqual([4, 3, 2, 1]);
  });

  it('drops what was loaded when a number comes back with another hash', () => {
    const merged = mergeBlocks([block(3), block(2), block(1)], [block(4, 'x4'), block(3, 'x3')], true);
    expect(merged.map((b) => b.block_hash)).toEqual(['x4', 'x3']);
  });

  it('drops blocks above the newest page, which the node no longer has', () => {
    expect(numbers(mergeBlocks([block(5), block(4), block(3)], [block(3)], true))).toEqual([3]);
    expect(mergeBlocks([block(1), block(0)], [], true)).toEqual([]);
  });
});

describe('rewardFirst', () => {
  it('moves the mining reward to the front and keeps the rest in order', () => {
    const tx = (id: string, sender: string) => ({ id, sender_address: sender }) as Transaction;
    const sorted = rewardFirst([tx('a', 'alice'), tx('r', 'SYSTEM'), tx('b', 'bob')]);
    expect(sorted.map((t) => t.id)).toEqual(['r', 'a', 'b']);
  });
});
