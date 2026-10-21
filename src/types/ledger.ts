export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Transaction {
  id: string;
  sender_address: string;
  receiver_address: string;
  amount: number;
  status: TransactionStatus;
  timestamp: string;
  signature?: string;
  tx_hash?: string | null;
  payload?: string | null;
  fee: number;
  block_id?: string | null;
  // Null while the transaction waits in the mempool (VLA-20).
  block_number?: number | null;
  block_hash?: string | null;
}

export interface Block {
  id: string;
  block_number: number;
  previous_hash: string;
  timestamp: string;
  nonce: number;
  block_hash: string;
  transaction_ids: string[];
  // The hashes that transaction links use, in the order of transaction_ids (VLA-20).
  transaction_hashes: string[];
}

// GET /blocks/{block_hash}: the block with its transactions instead of their ids.
export interface FullBlock extends Omit<Block, 'transaction_ids' | 'transaction_hashes'> {
  transactions: Transaction[];
}

export interface Wallet {
  public_key: string;
  private_key: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
