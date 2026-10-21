import { api } from './api';

// The address's balance as the API counts it. Public, like the nonce.
export async function getBalance(address: string): Promise<number> {
  const response = await api.get(`/wallets/${encodeURIComponent(address)}/balance`);
  const balance: unknown = response.data?.balance;
  if (typeof balance !== 'number' || !Number.isFinite(balance)) {
    throw new Error('The API did not answer /wallets/{address}/balance');
  }
  return balance;
}

// The nonce the API will accept next from this sender: 1 for a new address (VLA-16). Public, like the balance.
export async function getNextNonce(address: string): Promise<number> {
  const response = await api.get(`/wallets/${encodeURIComponent(address)}/nonce`);
  const nonce: unknown = response.data?.nonce;
  if (typeof nonce !== 'number' || !Number.isSafeInteger(nonce) || nonce < 1) {
    throw new Error('The API did not answer /wallets/{address}/nonce');
  }
  return nonce;
}
