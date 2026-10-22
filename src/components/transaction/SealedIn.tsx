import { Link } from 'react-router';
import { afterProofOfWork } from '../../lib/fingerprint';
import { Fingerprint } from '../Fingerprint';
import { useT } from '../useT';

// The block that holds the transaction, with its fingerprint, linked to its place on the chain.
export function SealedIn({ blockNumber, blockHash, above }: { blockNumber: number; blockHash: string; above: number }) {
  const t = useT();
  return (
    <Link
      to={`/?block=${blockNumber}`}
      className="flex flex-col gap-3 rounded-3xl bg-vl-surface p-5 transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised max-sm:p-[18px]"
    >
      <span className="flex items-baseline justify-between gap-2.5">
        <span className="text-sm text-vl-muted">{t.transaction.sealedIn.label}</span>{' '}
        <span className="font-vl-mono text-xs text-vl-muted">{t.transaction.linkBack(above)}</span>
      </span>{' '}
      <Fingerprint hex={afterProofOfWork(blockHash)} bars={8} className="h-[30px] gap-[3px]" />
      <span className="flex flex-wrap items-baseline justify-between gap-2.5">
        <span className="text-[28px] font-extrabold tracking-[-0.03em]">{t.transaction.sealedIn.block(blockNumber)}</span>{' '}
        <span className="font-vl-mono text-xs text-vl-muted">{blockHash.slice(0, 12)}…</span>
      </span>
    </Link>
  );
}
