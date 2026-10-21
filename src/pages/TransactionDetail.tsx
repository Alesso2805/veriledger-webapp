import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Certificate } from '../components/transaction/Certificate';
import { JourneyBar } from '../components/transaction/JourneyBar';
import { SealedIn } from '../components/transaction/SealedIn';
import { TransactionDetails } from '../components/transaction/TransactionDetails';
import { formatSealed, transactionKind } from '../lib/format';
import { journeyOf, transactionTitle } from '../lib/transaction';
import { detailOf, statusOf } from '../services/api';
import { getBlocks, getTransaction } from '../services/ledger';
import { useHealthStore } from '../store/useHealthStore';
import type { Transaction } from '../types/ledger';

const POLL_MS = 10_000;

type View =
  | { phase: 'loading' }
  | { phase: 'found'; transaction: Transaction; top: number | null }
  | { phase: 'not-found' }
  | { phase: 'failed'; detail: string };

// Artboard "E · Transacción y certificado" (VLW-29). Times are UTC, so the page says the same in every country.
export function TransactionDetail() {
  const { hash = '' } = useParams<{ hash: string }>();
  const [view, setView] = useState<View>({ phase: 'loading' });
  const online = useHealthStore((state) => state.online);
  const mounted = useRef(true);

  // The transaction, and the height that says how many blocks rest on its block. It is read again every 10 s,
  // so a waiting transaction is seen when it is sealed.
  const load = useCallback(async () => {
    try {
      const [transaction, top] = await Promise.all([
        getTransaction(hash),
        getBlocks(0, 1).then(
          (page) => page.items[0]?.block_number ?? null,
          () => null,
        ),
      ]);
      if (mounted.current) setView({ phase: 'found', transaction, top });
    } catch (error) {
      if (!mounted.current) return;
      if (statusOf(error) === 404) setView({ phase: 'not-found' });
      // What is already on screen stays when a later read fails; the shell's banner explains an outage.
      else setView((current) => (current.phase === 'found' ? current : { phase: 'failed', detail: detailOf(error, 'The API did not answer') }));
    }
  }, [hash]);

  useEffect(() => {
    mounted.current = true;
    setView({ phase: 'loading' });
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [load]);

  const transaction = view.phase === 'found' ? view.transaction : null;
  const blockNumber = typeof transaction?.block_number === 'number' ? transaction.block_number : null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-[13px] text-vl-muted">
        <Link to="/" className="text-vl-muted hover:text-vl-text">
          Tower
        </Link>
        <span aria-hidden="true">/</span>
        {blockNumber !== null && (
          <>
            <Link to={`/?block=${blockNumber}`} className="text-vl-muted hover:text-vl-text">
              Block #{blockNumber}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span aria-current="page" className="text-vl-text">
          Transaction
        </span>
      </nav>

      {(view.phase === 'loading' || (view.phase === 'failed' && online !== true)) && (
        <div role="status" aria-label="Loading transaction" className="mt-6 flex flex-col gap-3">
          <span className="h-9 w-[280px] max-w-full animate-vl-pulse rounded-lg bg-vl-surface" />
          <span className="h-24 animate-vl-pulse rounded-2xl bg-vl-surface" />
          <span className="h-[260px] animate-vl-pulse rounded-2xl bg-vl-surface" />
        </div>
      )}

      {view.phase === 'failed' && online === true && (
        <div
          role="alert"
          className="mt-6 flex animate-vl-fade-up flex-wrap items-center justify-between gap-3 rounded-[14px] border border-vl-danger bg-vl-surface px-[18px] py-4"
        >
          <span>Can’t load this transaction: {view.detail.replace(/\.$/, '')}. Retrying every 10 s.</span>
          <button
            type="button"
            onClick={() => void load()}
            className="h-10 rounded-[10px] border border-vl-line px-3.5 text-sm font-semibold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
          >
            Retry now
          </button>
        </div>
      )}

      {view.phase === 'not-found' && (
        <section className="mt-10 max-w-[620px] animate-vl-fade-up">
          <h1 className="text-[34px] font-bold tracking-[-0.02em]">No transaction with this hash on this node</h1>
          <p className="mt-2.5 font-vl-mono text-xs text-vl-muted [overflow-wrap:anywhere]">{hash}</p>
          <p className="mt-4 text-vl-muted">
            It may still be on its way from another node, or it was refused when it was sent, so it was never recorded.
            Rejected transactions leave no trace.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-vl-accent px-4 font-semibold text-vl-on-accent"
          >
            Back to the tower
          </Link>
        </section>
      )}

      {view.phase === 'found' && transaction && (
        <>
          <section className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <p className="text-[13px] text-vl-muted">{transactionKind(transaction)}</p>
              <h1 className="text-[36px] leading-[1.15] font-bold tracking-[-0.02em]">{transactionTitle(transaction)}</h1>
              <p className="mt-1.5 font-vl-mono text-xs text-vl-muted">{formatSealed(transaction.timestamp, 'UTC')} UTC</p>
            </div>
            {/* key: the chip fades in again when the status changes, as when a waiting transaction is sealed. */}
            <span
              key={transaction.status}
              className={`inline-flex h-9 animate-vl-fade-in items-center gap-2 rounded-full border bg-vl-surface px-3.5 text-sm font-semibold ${
                transaction.status === 'CONFIRMED'
                  ? 'border-vl-line'
                  : transaction.status === 'FAILED'
                    ? 'border-vl-danger'
                    : 'border-vl-accent'
              }`}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                <circle
                  cx="4"
                  cy="4"
                  r="4"
                  className={
                    transaction.status === 'CONFIRMED'
                      ? 'fill-vl-ok'
                      : transaction.status === 'FAILED'
                        ? 'fill-vl-danger'
                        : 'fill-vl-accent'
                  }
                />
              </svg>
              {transaction.status === 'CONFIRMED' && blockNumber !== null
                ? `In block #${blockNumber}`
                : transaction.status === 'FAILED'
                  ? 'Failed'
                  : 'Waiting'}
            </span>
          </section>

          <JourneyBar
            journey={journeyOf(transaction, view.top)}
            blockNumber={blockNumber}
            waiting={transaction.status === 'PENDING'}
            reward={transactionKind(transaction) === 'Mining reward'}
          />

          <div className="mt-5 flex flex-wrap items-start gap-5">
            <TransactionDetails transaction={transaction} />
            <aside className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
              {blockNumber !== null && transaction.block_hash && (
                <SealedIn
                  blockNumber={blockNumber}
                  blockHash={transaction.block_hash}
                  above={journeyOf(transaction, view.top).above ?? 0}
                />
              )}
              {blockNumber !== null && transaction.block_hash && transaction.payload && transactionKind(transaction) === 'Notarization' && (
                <Certificate payload={transaction.payload} blockNumber={blockNumber} blockHash={transaction.block_hash} />
              )}
            </aside>
          </div>
        </>
      )}
    </>
  );
}
