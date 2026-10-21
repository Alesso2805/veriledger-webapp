import type { components } from './api';

// The API's answers, generated from its OpenAPI document (AR-09, src/types/api.ts). Only the names are ours.
type Schemas = components['schemas'];

export type TransactionStatus = Schemas['TransactionStatus'];

// The sender's nonce; a coinbase carries its block number, and rows from before VLA-16 have none.
// block_number and block_hash are null while the transaction waits in the mempool (VLA-20).
export type Transaction = Schemas['TransactionResponseDTO'];

// transaction_hashes are the hashes that transaction links use, in the order of transaction_ids (VLA-20).
export type Block = Schemas['BlockResponseDTO'];

// GET /blocks/{block_hash}: the block with its transactions instead of their ids.
export type FullBlock = Schemas['FullBlockResponseDTO'];

// Every page of the API has the same fields around its items; the generated types name one per item type.
export type Paginated<T> = Omit<Schemas['PaginatedBlockResponseDTO'], 'items'> & { items: T[] };

// A key pair made in the browser (VLW-16); not an API answer, so it is written here.
export interface Wallet {
  public_key: string;
  private_key: string;
}
