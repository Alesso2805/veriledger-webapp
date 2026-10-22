import { Link } from 'react-router';
import { useT } from '../useT';

// The block that holds the transaction, linked to its place in the tower.
export function SealedIn({ blockNumber, blockHash, above }: { blockNumber: number; blockHash: string; above: number }) {
  const t = useT();
  return (
    <Link
      to={`/?block=${blockNumber}`}
      className="flex items-center gap-4 rounded-2xl border border-vl-line bg-vl-surface p-[18px] transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
    >
      <svg width="64" height="56" viewBox="0 0 64 56" aria-hidden="true" className="shrink-0">
        <polygon points="32,6 60,19 32,32 4,19" className="fill-vl-accent" />
        <polygon points="4,19 32,32 32,50 4,37" className="fill-vl-cube-left" />
        <polygon points="32,32 60,19 60,37 32,50" className="fill-vl-cube-right" />
      </svg>
      <span>
        <span className="block text-[13px] text-vl-muted">{t.transaction.sealedIn.label}</span>{' '}
        <span className="block text-[22px] font-bold">{t.transaction.sealedIn.block(blockNumber)}</span>{' '}
        <span className="block font-vl-mono text-[11px] text-vl-muted">
          {blockHash.slice(0, 12)}… · {t.transaction.blocksOnTop(above)}
        </span>
      </span>
    </Link>
  );
}
