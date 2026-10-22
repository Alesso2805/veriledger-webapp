import { useCallback, useEffect, useState } from 'react';
import { AddPeer } from '../components/network/AddPeer';
import { PeerList } from '../components/network/PeerList';
import { PeerMap } from '../components/network/PeerMap';
import { ResolveCard, type ResolvePhase, type ResolveResult } from '../components/network/ResolveCard';
import { useT } from '../components/useT';
import { detailOf } from '../services/api';
import { getBlocks } from '../services/ledger';
import { getPeers, resolveConflicts } from '../services/nodes';
import { useAppStore } from '../store/useAppStore';
import type { Peer } from '../types/network';

const topNumber = () =>
  getBlocks(0, 1).then(
    (page) => page.items[0]?.block_number ?? null,
    () => null,
  );

// Artboard "C · Red".
export function Network() {
  const t = useT();
  const [peers, setPeers] = useState<Peer[] | 'unknown' | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [phase, setPhase] = useState<ResolvePhase>('idle');
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [round, setRound] = useState(0);
  // A visitor only looks (ADR-0005). Signed in, the form shows until /auth/me answers; the API refuses anyone but an
  // admin with a 403 anyway.
  const signedIn = useAppStore((state) => state.token !== null);
  const role = useAppStore((state) => state.user?.role ?? null);
  const admin = signedIn && (role === null || role === 'admin');

  const load = useCallback(async () => {
    const [list, top] = await Promise.all([getPeers().catch(() => 'unknown' as const), topNumber()]);
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

  // The height before and after says what adopting a chain changed.
  const resolve = async () => {
    const before = height;
    setPhase('resolving');
    setResult(null);
    try {
      const { replaced } = await resolveConflicts();
      const after = await topNumber();
      setHeight(after);
      setResult(replaced ? { kind: 'replaced', before, after } : { kind: 'kept' });
    } catch (error) {
      setResult({ kind: 'failed', detail: detailOf(error, t.network.resolve.noAnswer) });
    } finally {
      setRound((count) => count + 1);
      setPhase('replied');
    }
  };

  const list = Array.isArray(peers) ? peers : [];

  return (
    <>
      <h1 className="text-[56px] leading-none font-extrabold tracking-[-0.035em] max-sm:text-[40px]">{t.network.title}</h1>
      <p className="mt-2.5 max-w-[720px] text-[17px] text-vl-muted">{t.network.lead}</p>
      <div className="mt-[22px] flex flex-wrap items-start gap-[22px]">
        <PeerMap peers={list} height={height} fresh={fresh} phase={phase} round={round} />
        <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-[22px]">
          <ResolveCard
            admin={admin}
            peerCount={list.length}
            phase={phase}
            result={result}
            onResolve={() => void resolve()}
          />
          <AddPeer admin={admin} onAdded={added} />
          <PeerList peers={peers} fresh={fresh} />
        </aside>
      </div>
    </>
  );
}
