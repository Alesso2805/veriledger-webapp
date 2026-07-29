export interface Transaction {
  id: string;
  sender_address: string;
  receiver_address: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  timestamp: string;
  signature?: string;
  tx_hash?: string;
  payload?: string | null;
  fee: number;
  block_id?: string;
}

export interface Block {
  id: string;
  block_number: number;
  previous_hash: string;
  timestamp: string;
  nonce: number;
  block_hash: string;
  transaction_ids: string[];
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
