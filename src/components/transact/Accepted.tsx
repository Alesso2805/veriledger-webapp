import { Link } from 'react-router';
import { useT } from '../useT';

export function Accepted({ txHash, onAgain }: { txHash: string; onAgain: () => void }) {
  const words = useT().transact.accepted;
  return (
    <div role="status" className="animate-vl-fade-up rounded-3xl bg-vl-ok-soft p-[22px] max-sm:p-[18px]">
      <p className="flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.02em]">
        <svg width="24" height="24" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0 animate-vl-pop">
          <circle cx="11" cy="11" r="10" className="fill-vl-ok" />
          <path d="M6.5 11.5l3 3 6-6.5" fill="none" strokeWidth="2" className="stroke-vl-on-accent" />
        </svg>
        {words.title}
      </p>
      <p className="mt-1.5">{words.text}</p>
      <p className="mt-1.5 mb-3.5 font-vl-mono text-[13px] [overflow-wrap:anywhere]" title={txHash}>
        tx {txHash.slice(0, 16)}…{txHash.slice(-8)}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <Link
          to={`/transaction/${txHash}`}
          className="inline-flex h-12 items-center rounded-[14px] bg-vl-strong px-5 font-bold text-vl-on-strong"
        >
          {words.open}
        </Link>
        <button
          type="button"
          onClick={onAgain}
          className="h-12 rounded-[14px] border-[1.5px] border-vl-line bg-vl-surface px-5 text-[15px] font-bold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
        >
          {words.again}
        </button>
      </div>
    </div>
  );
}
