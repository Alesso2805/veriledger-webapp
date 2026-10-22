import type { Transaction } from '../../types/ledger';
import { useT } from '../useT';
import { TransactionRow } from './TransactionRow';

interface Props {
  waiting: Transaction[] | null;
  total: number | null;
  // While a block is being mined these transactions are about to leave the list.
  dimmed: boolean;
}

// The mempool's newest transactions; the count is the API's total, which can be more than the list shows.
export function WaitingList({ waiting, total, dimmed }: Props) {
  const t = useT();
  return (
    <section aria-labelledby="pool-h" className="rounded-2xl border border-vl-line bg-vl-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="pool-h" className="text-[15px] font-semibold">
          {t.chain.waiting.title}
        </h2>
        <span className="font-vl-mono text-xs text-vl-accent">{total ?? '—'}</span>
      </div>
      {waiting && waiting.length > 0 && (
        <ul className={`mt-2.5 transition-opacity duration-(--vl-dur-slow) ${dimmed ? 'opacity-45' : ''}`}>
          {waiting.map((transaction) => (
            <li key={transaction.id} className="border-t border-vl-line-soft">
              <TransactionRow transaction={transaction} showFee />
            </li>
          ))}
        </ul>
      )}
      {waiting?.length === 0 && (
        <p className="mt-2.5 animate-vl-fade-in text-sm text-vl-muted">
          {t.chain.waiting.empty}
        </p>
      )}
    </section>
  );
}
