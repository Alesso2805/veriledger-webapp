import { useCallback, useEffect, useState } from 'react';
import { AddPeer } from '../components/network/AddPeer';
import { PeerList } from '../components/network/PeerList';
import { PeerMap } from '../components/network/PeerMap';
import { getBlocks } from '../services/ledger';
import { getPeers } from '../services/nodes';
import { useAppStore } from '../store/useAppStore';
import type { Peer } from '../types/network';

// Artboard "E · Red" (VLW-32). Resolving conflicts, with its pulses, comes with VLW-32b.
export function Network() {
  const [peers, setPeers] = useState<Peer[] | 'unknown' | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  // Until /auth/me answers the form shows; the API refuses anyone but an admin with a 403 anyway.
  const role = useAppStore((state) => state.user?.role ?? null);
  const admin = role === null || role === 'admin';

  const load = useCallback(async () => {
    const [list, top] = await Promise.all([
      getPeers().catch(() => 'unknown' as const),
      getBlocks(0, 1).then(
        (page) => page.items[0]?.block_number ?? null,
        () => null,
      ),
    ]);
    setPeers(list);
    setHeight(top);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const added = (url: string) => {
    setFresh(url);
    void load();
  };

  return (
    <>
      <h1 className="text-[30px] font-bold tracking-[-0.02em]">Network</h1>
      <p className="mt-1 max-w-[720px] text-vl-muted">
        The peers this node knows. Resolving asks each of them for its chain and keeps the longest one that passes every
        check.
      </p>
      <div className="mt-5 flex flex-wrap items-start gap-5">
        <PeerMap peers={Array.isArray(peers) ? peers : []} height={height} fresh={fresh} />
        <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
          <AddPeer admin={admin} onAdded={added} />
          <PeerList peers={peers} fresh={fresh} />
        </aside>
      </div>
    </>
  );
}
