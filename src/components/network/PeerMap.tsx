import { MAP, peerLabel, ringPoints } from '../../lib/peers';
import type { Peer } from '../../types/network';

const NODE = 84;

interface Props {
  peers: Peer[];
  height: number | null;
  // The peer just registered pops in; the others glide to their new places on the ring.
  fresh: string | null;
}

// Positions and edges move with transform only, so adding a peer glides (DESIGN.md › Motion map). The peer list
// carries the same information as text, so the map is one image to a screen reader.
export function PeerMap({ peers, height, fresh }: Props) {
  const points = ringPoints(peers.length);
  const label = `This node${height === null ? '' : ` at height ${height}`}, with ${peers.length} ${peers.length === 1 ? 'peer' : 'peers'}`;

  return (
    <section
      aria-label="Peer map"
      className="min-w-0 flex-[999_1_640px] overflow-x-auto rounded-2xl border border-vl-line bg-vl-surface"
    >
      <div role="img" aria-label={label} className="relative mx-auto" style={{ width: MAP.width, height: MAP.height }}>
        {points.map((point, index) => (
          <span
            key={peers[index].url}
            aria-hidden="true"
            className="absolute h-0.5 w-[170px] origin-[0_50%] bg-vl-line transition-transform duration-(--vl-dur-slow) ease-vl-out"
            style={{ left: MAP.cx, top: MAP.cy - 1, transform: `rotate(${point.degrees}deg)` }}
          />
        ))}
        {peers.length === 0 && (
          <span
            aria-hidden="true"
            className="absolute animate-vl-fade-in rounded-full border border-dashed border-vl-line"
            style={{ left: MAP.cx - MAP.radius, top: MAP.cy - MAP.radius, width: MAP.radius * 2, height: MAP.radius * 2 }}
          />
        )}
        <div className="absolute top-0 left-0" style={{ transform: `translate(${MAP.cx - 50}px, ${MAP.cy - 50}px)` }}>
          <div className="flex size-[100px] flex-col items-center justify-center rounded-full border-2 border-vl-accent bg-vl-raised text-center">
            <span className="text-[13px] font-semibold">This node</span>
            <span className="font-vl-mono text-[10px] text-vl-muted">height {height ?? '—'}</span>
          </div>
        </div>
        {peers.map((peer, index) => {
          const { name, detail } = peerLabel(peer.url);
          const point = points[index];
          return (
            <div
              key={peer.url}
              className="absolute top-0 left-0 transition-transform duration-(--vl-dur-slow) ease-vl-out"
              style={{ transform: `translate(${point.x - NODE / 2}px, ${point.y - NODE / 2}px)` }}
            >
              <div
                className={`flex size-[84px] flex-col items-center justify-center rounded-full border-2 border-vl-cube-top bg-vl-bg text-center transition-colors duration-(--vl-dur-base) ${
                  peer.url === fresh ? 'animate-vl-pop' : ''
                }`}
              >
                <span className="max-w-[76px] truncate text-xs font-semibold">{name}</span>
                <span className="max-w-[76px] truncate font-vl-mono text-[9px] text-vl-muted">{detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
