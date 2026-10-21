import { api } from './api';

// The nonce the API will accept next from this sender: 1 for a new address (VLA-16). Public, like the balance.
export async function getNextNonce(address: string): Promise<number> {
  const response = await api.get(`/wallets/${encodeURIComponent(address)}/nonce`);
  const nonce: unknown = response.data?.nonce;
  if (typeof nonce !== 'number' || !Number.isSafeInteger(nonce) || nonce < 1) {
    throw new Error('The API did not answer /wallets/{address}/nonce');
  }
  return nonce;
}
