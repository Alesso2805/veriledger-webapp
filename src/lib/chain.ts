import type { Block, Transaction } from '../types/ledger';

// The blocks the chain has loaded, newest first. A page from the API replaces the blocks it overlaps. If one
// of its numbers now has another hash, a peer's chain replaced ours, so what was loaded before is dropped. The
// newest page also drops blocks above its top, which the node no longer has (its database was reset, say).
export function mergeBlocks(known: Block[], page: Block[], newest: boolean): Block[] {
  const byNumber = new Map(known.map((block) => [block.block_number, block]));
  const replaced = page.some((block) => {
    const seen = byNumber.get(block.block_number);
    return seen !== undefined && seen.block_hash !== block.block_hash;
  });
  if (replaced) byNumber.clear();
  if (newest) {
    const top = page[0]?.block_number ?? -1;
    for (const number of byNumber.keys()) if (number > top) byNumber.delete(number);
  }
  for (const block of page) byNumber.set(block.block_number, block);
  return [...byNumber.values()].sort((a, b) => b.block_number - a.block_number);
}

// The API returns a block's transactions in no set order; the mining reward reads best first.
export function rewardFirst(transactions: Transaction[]): Transaction[] {
  const isReward = (transaction: Transaction) => (transaction.sender_address === 'SYSTEM' ? 0 : 1);
  return [...transactions].sort((a, b) => isReward(a) - isReward(b));
}
