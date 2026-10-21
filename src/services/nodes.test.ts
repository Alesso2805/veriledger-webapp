import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { getPeers, registerPeer, resolveConflicts } from './nodes';

const peer = { id: 'n1', url: 'http://127.0.0.1:8001', status: 'ACTIVE' };
const indexHtml = '<!doctype html><html></html>';

describe('node endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getPeers reads the peers', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [peer] });

    await expect(getPeers()).resolves.toEqual([peer]);
    expect(get).toHaveBeenCalledWith('/nodes');
  });

  it('registerPeer sends the address and returns the peer', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: peer });

    await expect(registerPeer(peer.url)).resolves.toEqual(peer);
    expect(post).toHaveBeenCalledWith('/nodes/register', { url: peer.url });
  });

  it('resolveConflicts says whether the chain was replaced', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { message: 'Chain was replaced', replaced: true } });

    await expect(resolveConflicts()).resolves.toEqual({ message: 'Chain was replaced', replaced: true });
    expect(post).toHaveBeenCalledWith('/nodes/resolve');
  });

  it('each rejects an answer that is not the API, such as index.html', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: indexHtml });
    vi.spyOn(api, 'post').mockResolvedValue({ data: indexHtml });

    await expect(getPeers()).rejects.toThrow('The API did not answer /nodes');
    await expect(registerPeer(peer.url)).rejects.toThrow('The API did not answer /nodes/register');
    await expect(resolveConflicts()).rejects.toThrow('The API did not answer /nodes/resolve');
  });
});
