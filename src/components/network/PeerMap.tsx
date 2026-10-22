import { useLayoutEffect, useRef } from 'react';
import { MAP, peerHex, peerLabel, ringPoints } from '../../lib/peers';
import type { Peer } from '../../types/network';
import { Avatar } from '../Avatar';
import type { ResolvePhase } from './ResolveCard';
import { useT } from '../useT';

const NODE = 96;
const CENTRE = { width: 120, height: 100 };

interface Props {
  peers: Peer[];
  height: number | null;
  // The peer just registered pops in; the others glide to their new places on the ring.
  fresh: string | null;
  // While resolve is pending, one pulse per peer travels outwards and loops; when it settles, one comes back.
  phase: ResolvePhase;
  // A new value replays the reply pulses for the next answer.
  round: number;
}

const pulse = 'absolute top-0 left-0 size-3 rounded-full animate-vl-travel';

// Positions and edges move with transform only, so adding a peer glides (DESIGN.md › Motion map). The peer list
// carries the same information as text, so the map is one image to a screen reader. On a phone the map scrolls
// sideways inside its box, which takes the focus so the arrow keys can scroll it too (VLW-24).
export function PeerMap({ peers, height, fresh, phase, round }: Props) {
  const t = useT();
  const points = ringPoints(peers.length);
  const label = t.network.mapLabel(height, peers.length);
  const box = useRef<HTMLElement>(null);
  const resolving = phase === 'resolving';

  // A narrow box opens on this node, in the middle of the map, rather than on the map's empty left edge.
  useLayoutEffect(() => {
    const element = box.current;
    if (element) element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
  }, []);

  return (
    <section
      ref={box}
      aria-label={t.network.map}
      tabIndex={0}
      className="min-w-0 flex-[999_1_640px] overflow-x-auto rounded-3xl bg-vl-surface bg-[radial-gradient(circle,var(--color-vl-line-soft)_1.5px,transparent_1.6px)] bg-[length:24px_24px]"
    >
      <div role="img" aria-label={label} className="relative mx-auto" style={{ width: MAP.width, height: MAP.height }}>
        {points.map((point, index) => (
          <span
            key={peers[index].url}
            aria-hidden="true"
            className={`absolute h-0.5 w-[170px] origin-[0_50%] transition-transform duration-(--vl-dur-slow) ease-vl-out ${
              resolving
                ? 'bg-[repeating-linear-gradient(90deg,var(--color-vl-accent)_0_6px,transparent_6px_11px)]'
                : 'bg-[repeating-linear-gradient(90deg,var(--color-vl-faint)_0_6px,transparent_6px_11px)]'
            }`}
            style={{ left: MAP.cx, top: MAP.cy - 1, transform: `rotate(${point.degrees}deg)` }}
          />
        ))}
        {peers.length === 0 && (
          <span
            aria-hidden="true"
            className="absolute animate-vl-fade-in rounded-full border-2 border-dashed border-vl-faint"
            style={{ left: MAP.cx - MAP.radius, top: MAP.cy - MAP.radius, width: MAP.radius * 2, height: MAP.radius * 2 }}
          />
        )}
        {/* offset-path follows the edge from this node to each peer, and back (DESIGN.md › Motion map). */}
        {resolving &&
          points.map((point, index) => (
            <span
              key={`out-${peers[index].url}`}
              aria-hidden="true"
              className={`${pulse} bg-vl-accent`}
              style={{
                offsetPath: `path('M${MAP.cx} ${MAP.cy} L${point.x} ${point.y}')`,
                offsetRotate: '0deg',
                animationIterationCount: 'infinite',
                animationDelay: `${index * 90}ms`,
              }}
            />
          ))}
        {phase === 'replied' &&
          points.map((point, index) => (
            <span
              key={`back-${round}-${peers[index].url}`}
              aria-hidden="true"
              className={`${pulse} border-[2.5px] border-vl-accent bg-vl-surface`}
              style={{ offsetPath: `path('M${point.x} ${point.y} L${MAP.cx} ${MAP.cy}')`, offsetRotate: '0deg' }}
            />
          ))}
        <div
          className="absolute top-0 left-0"
          style={{ transform: `translate(${MAP.cx - CENTRE.width / 2}px, ${MAP.cy - CENTRE.height / 2}px)` }}
        >
          <div className="flex h-[100px] w-[120px] flex-col items-center justify-center gap-0.5 rounded-3xl bg-vl-ink text-center text-vl-on-ink">
            <span className="text-[15px] font-bold">{t.network.thisNode}</span>
            <span className="font-vl-mono text-xs text-vl-on-ink-muted">{t.network.height(height === null ? '—' : String(height))}</span>
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
                className={`flex size-24 flex-col items-center justify-center gap-1 rounded-[22px] bg-vl-surface text-center transition-shadow duration-(--vl-dur-base) ${
                  resolving ? 'shadow-[0_0_0_2.5px_var(--color-vl-accent)]' : 'shadow-[0_0_0_1.5px_var(--color-vl-line-soft)]'
                } ${peer.url === fresh ? 'animate-vl-pop' : ''}`}
              >
                <Avatar hex={peerHex(peer.url)} size={28} />
                <span className="max-w-[86px] truncate text-sm font-bold">{name}</span>
                <span className="max-w-[86px] truncate font-vl-mono text-[10px] text-vl-muted">{detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
