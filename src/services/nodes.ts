import type { Peer, ResolveOutcome } from '../types/network';
import { api } from './api';

// Public: anyone may see who this node talks to.
export async function getPeers(): Promise<Peer[]> {
  const response = await api.get('/nodes');
  if (!Array.isArray(response.data)) throw new Error('The API did not answer /nodes');
  return response.data as Peer[];
}

// Admin only. The API refuses an address that is not http(s), has no host, does not resolve or is
// not public, and a duplicate, each with a 400 whose detail says why.
export async function registerPeer(url: string): Promise<Peer> {
  const response = await api.post('/nodes/register', { url });
  if (typeof (response.data as Peer | undefined)?.url !== 'string') throw new Error('The API did not answer /nodes/register');
  return response.data as Peer;
}

// Admin only. Asks every peer for its chain and adopts the longest one that passes every check.
export async function resolveConflicts(): Promise<ResolveOutcome> {
  const response = await api.post('/nodes/resolve');
  if (typeof (response.data as ResolveOutcome | undefined)?.replaced !== 'boolean') {
    throw new Error('The API did not answer /nodes/resolve');
  }
  return response.data as ResolveOutcome;
}
