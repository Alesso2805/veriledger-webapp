import type { Peer } from '../../types/network';
import { useT } from '../useT';

// Every peer is "registered": the API stores a status word at registration, but nothing checks a peer, so
// the page never calls one active (DESIGN.md › What the design does not show).
export function PeerList({ peers, fresh }: { peers: Peer[] | 'unknown' | null; fresh: string | null }) {
  const words = useT().network.list;
  const list = Array.isArray(peers) ? peers : [];
  return (
    <section aria-labelledby="peers-h" className="rounded-2xl border border-vl-line bg-vl-surface p-5">
      <h2 id="peers-h" className="mb-2 text-[15px] font-semibold">
        {words.title(Array.isArray(peers) ? String(peers.length) : '—')}
      </h2>
      {peers === null && <span className="block h-10 animate-vl-pulse rounded-lg bg-vl-raised" />}
      {peers === 'unknown' && <p className="text-sm text-vl-muted">{words.noAnswer}</p>}
      {Array.isArray(peers) && peers.length === 0 && (
        <p className="text-sm text-vl-muted">{words.empty}</p>
      )}
      <ul>
        {list.map((peer) => (
          <li
            key={peer.url}
            className={`flex justify-between gap-3 border-t border-vl-line-soft py-2.5 ${peer.url === fresh ? 'animate-vl-fade-up' : ''}`}
          >
            <span className="font-vl-mono text-xs [overflow-wrap:anywhere]">{peer.url}</span>{' '}
            <span className="text-xs whitespace-nowrap text-vl-muted">{words.registered}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
