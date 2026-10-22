import { Link } from 'react-router';
import { activityRow } from '../../lib/activity';
import type { Transaction } from '../../types/ledger';
import { Avatar } from '../Avatar';
import { useT } from '../useT';

const CHIP: Record<Transaction['status'], string> = { PENDING: 'bg-vl-wait-soft', CONFIRMED: 'bg-vl-ok-soft', FAILED: 'bg-vl-danger-soft' };

interface Props {
  address: string;
  // null while the first page loads, 'unknown' when the node did not answer.
  transactions: Transaction[] | 'unknown' | null;
  total: number;
}

// The address's newest transactions (VLA-34), each linked to its page.
export function Activity({ address, transactions, total }: Props) {
  const words = useT().wallet.activity;
  return (
    <section
      aria-labelledby="act-h"
      className="min-w-0 flex-[999_1_560px] rounded-[28px] bg-vl-surface p-[26px] max-sm:p-5"
    >
      <h2 id="act-h" className="mb-1.5 text-2xl font-bold tracking-[-0.02em]">
        {words.title}
      </h2>
      {transactions === null && (
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map((row) => (
            <span key={row} className="h-[60px] animate-vl-pulse rounded-[14px] bg-vl-skeleton" />
          ))}
        </div>
      )}
      {transactions === 'unknown' && <p className="text-vl-muted">{words.noAnswer}</p>}
      {Array.isArray(transactions) && transactions.length === 0 && (
        <div className="animate-vl-fade-in">
          <p className="text-vl-muted">{words.empty}</p>
          <Link
            to="/"
            className="mt-3 inline-flex h-[46px] items-center rounded-[14px] border-[1.5px] border-vl-line px-[18px] font-bold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
          >
            {words.goToChain}
          </Link>
        </div>
      )}
      {Array.isArray(transactions) && transactions.length > 0 && (
        <>
          <ul>
            {transactions.map((transaction, index) => {
              const row = activityRow(address, transaction, words);
              const content = (
                <>
                  <Avatar hex={row.peer} size={40} />
                  <span className="min-w-0 flex-[1_1_220px]">
                    <span className="block font-bold">{row.title}</span>{' '}
                    <span className="block font-vl-mono text-xs text-vl-muted [overflow-wrap:anywhere]">{row.detail}</span>
                  </span>{' '}
                  <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${CHIP[transaction.status]}`}>{row.status}</span>{' '}
                  <span className="flex-[0_0_96px] text-right font-vl-mono font-medium">{row.change}</span>
                </>
              );
              const line = 'flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[14px] px-2 py-3.5';
              return (
                // The rows arrive together and fade in one after another, 40 ms apart.
                <li
                  key={transaction.id}
                  className="animate-vl-fade-up border-t border-vl-line-soft"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {transaction.tx_hash ? (
                    <Link
                      to={`/transaction/${transaction.tx_hash}`}
                      className={`${line} transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className={line}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {total > transactions.length && (
            <p className="mt-2 text-[13px] text-vl-muted">
              {words.newest(transactions.length, total)}
            </p>
          )}
        </>
      )}
    </section>
  );
}
