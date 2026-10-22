import { Link } from 'react-router';
import { useT } from '../useT';

// The node accepted the transaction: it waits in the mempool, and its page follows it into a block.
export function Accepted({ txHash, onAgain }: { txHash: string; onAgain: () => void }) {
  const words = useT().transact.accepted;
  return (
    <div role="status" className="animate-vl-fade-up rounded-2xl border border-vl-ok bg-vl-surface p-[18px]">
      <p className="flex items-center gap-2.5 text-[17px] font-bold">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <circle cx="9" cy="9" r="9" className="fill-vl-ok" />
          <path d="M5 9.5l2.6 2.5L13 6.5" fill="none" strokeWidth="2" className="stroke-vl-on-accent" />
        </svg>
        {words.title}
      </p>
      <p className="mt-1.5 text-vl-muted">{words.text}</p>
      <p className="mt-1.5 mb-3.5 font-vl-mono text-xs" title={txHash}>
        tx {txHash.slice(0, 16)}…{txHash.slice(-8)}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <Link
          to={`/transaction/${txHash}`}
          className="inline-flex h-[42px] items-center rounded-[10px] bg-vl-accent px-4 font-semibold text-vl-on-accent"
        >
          {words.open}
        </Link>
        <button
          type="button"
          onClick={onAgain}
          className="h-[42px] rounded-[10px] border border-vl-line px-4 text-sm font-semibold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
        >
          {words.again}
        </button>
      </div>
    </div>
  );
}
