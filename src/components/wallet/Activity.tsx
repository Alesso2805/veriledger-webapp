import { Link } from 'react-router';
import { activityRow } from '../../lib/activity';
import type { Transaction } from '../../types/ledger';
import { useT } from '../useT';

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
      className="min-w-0 flex-[999_1_560px] rounded-2xl border border-vl-line bg-vl-surface p-[22px]"
    >
      <h2 id="act-h" className="mb-2 text-[15px] font-semibold">
        {words.title}
      </h2>
      {transactions === null && (
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map((row) => (
            <span key={row} className="h-12 animate-vl-pulse rounded-lg bg-vl-raised" />
          ))}
        </div>
      )}
      {transactions === 'unknown' && <p className="text-vl-muted">{words.noAnswer}</p>}
      {Array.isArray(transactions) && transactions.length === 0 && (
        <div className="animate-vl-fade-in">
          <p className="text-vl-muted">
            {words.empty}
          </p>
          <Link
            to="/"
            className="mt-3 inline-flex h-10 items-center rounded-[10px] border border-vl-line px-3.5 font-semibold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
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
                  <span>
                    <span className="block font-semibold">{row.title}</span>{' '}
                    <span className="block font-vl-mono text-[11px] text-vl-muted">{row.detail}</span>
                  </span>{' '}
                  <span className="text-right">
                    <span className="block font-vl-mono text-[15px]">{row.change}</span>{' '}
                    <span className="block text-xs text-vl-muted">{row.status}</span>
                  </span>
                </>
              );
              const line = 'flex flex-wrap justify-between gap-x-3.5 gap-y-1.5 rounded-lg px-2 py-3';
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
