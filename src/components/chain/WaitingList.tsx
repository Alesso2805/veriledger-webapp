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
  const words = useT().chain.waiting;
  return (
    <section aria-labelledby="pool-h" className="rounded-3xl bg-vl-surface p-[22px]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="pool-h" className="text-xl font-bold tracking-[-0.02em]">
          {words.title}
        </h2>
        <span className="font-vl-mono text-sm font-medium text-vl-accent">{total ?? '—'}</span>
      </div>
      {waiting && waiting.length > 0 && (
        <ul className={`mt-2 transition-opacity duration-(--vl-dur-slow) ${dimmed ? 'opacity-45' : ''}`}>
          {waiting.map((transaction) => (
            <li key={transaction.id} className="border-t border-vl-line-soft">
              <TransactionRow transaction={transaction} waiting />
            </li>
          ))}
        </ul>
      )}
      {waiting?.length === 0 && <p className="mt-2 animate-vl-fade-in text-[15px] text-vl-muted">{words.empty}</p>}
    </section>
  );
}
