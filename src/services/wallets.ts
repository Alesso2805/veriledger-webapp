import type { Paginated, Transaction } from '../types/ledger';
import { api } from './api';

// What the address sent or received, newest first; public, like the balance. The API takes 1 to 100.
export async function getWalletTransactions(address: string, skip: number, limit: number): Promise<Paginated<Transaction>> {
  const response = await api.get(`/wallets/${encodeURIComponent(address)}/transactions`, { params: { skip, limit } });
  const page = response.data as Paginated<Transaction> | undefined;
  if (!Array.isArray(page?.items) || typeof page.total !== 'number') {
    throw new Error('The API did not answer /wallets/{address}/transactions');
  }
  return page;
}

// Public, like the nonce.
export async function getBalance(address: string): Promise<number> {
  const response = await api.get(`/wallets/${encodeURIComponent(address)}/balance`);
  const balance: unknown = response.data?.balance;
  if (typeof balance !== 'number' || !Number.isFinite(balance)) {
    throw new Error('The API did not answer /wallets/{address}/balance');
  }
  return balance;
}

// The nonce the API will accept next from this sender: 1 for a new address. Public, like the balance.
export async function getNextNonce(address: string): Promise<number> {
  const response = await api.get(`/wallets/${encodeURIComponent(address)}/nonce`);
  const nonce: unknown = response.data?.nonce;
  if (typeof nonce !== 'number' || !Number.isSafeInteger(nonce) || nonce < 1) {
    throw new Error('The API did not answer /wallets/{address}/nonce');
  }
  return nonce;
}
