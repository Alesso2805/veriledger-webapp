import { peerHex } from '../../lib/peers';
import type { Peer } from '../../types/network';
import { Avatar } from '../Avatar';
import { useT } from '../useT';

// Every peer is "registered": the API stores a status word at registration, but nothing checks a peer, so
// the page never calls one active (DESIGN.md › What the design does not show).
export function PeerList({ peers, fresh }: { peers: Peer[] | 'unknown' | null; fresh: string | null }) {
  const words = useT().network.list;
  const list = Array.isArray(peers) ? peers : [];
  return (
    <section aria-labelledby="peers-h" className="rounded-3xl bg-vl-surface p-6 max-sm:p-5">
      <h2 id="peers-h" className="mb-1.5 text-xl font-bold tracking-[-0.02em]">
        {words.title(Array.isArray(peers) ? String(peers.length) : '—')}
      </h2>
      {peers === null && <span className="block h-[52px] animate-vl-pulse rounded-[14px] bg-vl-skeleton" />}
      {peers === 'unknown' && <p className="text-[15px] text-vl-muted">{words.noAnswer}</p>}
      {Array.isArray(peers) && peers.length === 0 && <p className="text-[15px] text-vl-muted">{words.empty}</p>}
      <ul>
        {list.map((peer) => (
          <li
            key={peer.url}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-vl-line-soft py-3 ${
              peer.url === fresh ? 'animate-vl-fade-up' : ''
            }`}
          >
            <Avatar hex={peerHex(peer.url)} size={28} />
            <span className="min-w-0 flex-[1_1_160px] font-vl-mono text-[13px] [overflow-wrap:anywhere]">{peer.url}</span>{' '}
            <span className="rounded-full bg-vl-bg px-2.5 py-1 text-[13px] whitespace-nowrap text-vl-muted">{words.registered}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
