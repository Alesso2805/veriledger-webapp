import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Certificate } from '../components/transaction/Certificate';
import { JourneyBar } from '../components/transaction/JourneyBar';
import { SealedIn } from '../components/transaction/SealedIn';
import { TransactionDetails } from '../components/transaction/TransactionDetails';
import { useLanguage, useT } from '../components/useT';
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

// Artboard "C · Transacción y certificado" (VLW-44). Times are UTC, so the page says the same in every country.
export function TransactionDetail() {
  const t = useT();
  const language = useLanguage();
  const noAnswer = t.transaction.noAnswer;
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
      else setView((current) => (current.phase === 'found' ? current : { phase: 'failed', detail: detailOf(error, noAnswer) }));
    }
  }, [hash, noAnswer]);

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
      <nav aria-label={t.transaction.breadcrumb} className="flex flex-wrap gap-2 text-sm text-vl-muted">
        <Link to="/" className="text-vl-muted hover:text-vl-text">
          {t.transaction.chain}
        </Link>
        <span aria-hidden="true">/</span>
        {blockNumber !== null && (
          <>
            <Link to={`/?block=${blockNumber}`} className="text-vl-muted hover:text-vl-text">
              {t.transaction.block(blockNumber)}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span aria-current="page" className="text-vl-text">
          {t.transaction.transaction}
        </span>
      </nav>

      {(view.phase === 'loading' || (view.phase === 'failed' && online !== true)) && (
        <div role="status" aria-label={t.transaction.loading} className="mt-6 flex flex-col gap-3.5">
          <span className="h-11 w-[300px] max-w-full animate-vl-pulse rounded-xl bg-vl-skeleton" />
          <span className="h-[120px] animate-vl-pulse rounded-3xl bg-vl-skeleton" />
          <span className="h-[300px] animate-vl-pulse rounded-3xl bg-vl-skeleton" />
        </div>
      )}

      {view.phase === 'failed' && online === true && (
        <div
          role="alert"
          className="mt-6 flex animate-vl-fade-up flex-wrap items-center justify-between gap-3 rounded-[18px] bg-vl-danger-soft px-[18px] py-3.5"
        >
          <span className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0 fill-none stroke-vl-danger" strokeWidth="1.6">
              <path d="M9 2l7.5 13h-15z" />
              <path d="M9 7v3.5M9 12.5v.5" />
            </svg>
            <span>{t.transaction.cantLoad(view.detail.replace(/\.$/, ''))}</span>
          </span>
          <button type="button" onClick={() => void load()} className="h-11 rounded-xl bg-vl-strong px-4 text-sm font-bold text-vl-on-strong">
            {t.shell.offline.retry}
          </button>
        </div>
      )}

      {view.phase === 'not-found' && (
        <section className="mt-8 max-w-[680px] animate-vl-fade-up rounded-[28px] bg-vl-surface p-8 max-sm:p-[18px]">
          <h1 className="text-[40px] leading-[1.05] font-extrabold tracking-[-0.03em] max-sm:text-[30px]">{t.transaction.notFoundTitle}</h1>
          <p className="mt-3 font-vl-mono text-[13px] text-vl-muted [overflow-wrap:anywhere]">{hash}</p>
          <p className="mt-4 text-vl-muted">{t.transaction.notFoundText}</p>
          <Link
            to="/"
            className="mt-[22px] inline-flex h-[50px] items-center rounded-[14px] bg-vl-strong px-[22px] font-bold text-vl-on-strong"
          >
            {t.transaction.back}
          </Link>
        </section>
      )}

      {view.phase === 'found' && transaction && (
        <>
          <section className="mt-3.5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div className="min-w-0">
              <p className="text-[15px] text-vl-muted">{t.kinds[transactionKind(transaction)]}</p>
              <h1 className="text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em] [overflow-wrap:anywhere] max-sm:text-[30px]">
                {transactionTitle(transaction, t.transaction.titles)}
              </h1>
              <p className="mt-1.5 font-vl-mono text-[13px] text-vl-muted">
                {formatSealed(transaction.timestamp, 'UTC', language)} {t.transaction.utc}
              </p>
            </div>
            {/* key: the chip fades in again when the status changes, as when a waiting transaction is sealed. */}
            <span
              key={transaction.status}
              className={`inline-flex h-10 animate-vl-fade-in items-center gap-2 rounded-full px-4 text-[15px] font-bold ${
                transaction.status === 'CONFIRMED'
                  ? 'bg-vl-ok-soft'
                  : transaction.status === 'FAILED'
                    ? 'bg-vl-danger-soft'
                    : 'bg-vl-wait-soft'
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-[9px] rounded-full ${
                  transaction.status === 'CONFIRMED' ? 'bg-vl-ok' : transaction.status === 'FAILED' ? 'bg-vl-danger' : 'bg-vl-text'
                }`}
              />
              {transaction.status === 'CONFIRMED' && blockNumber !== null
                ? t.transaction.chips.sealed(blockNumber)
                : transaction.status === 'FAILED'
                  ? t.transaction.chips.failed
                  : t.transaction.chips.waiting}
            </span>
          </section>

          <JourneyBar
            journey={journeyOf(transaction, view.top)}
            blockNumber={blockNumber}
            waiting={transaction.status === 'PENDING'}
            reward={transactionKind(transaction) === 'Mining reward'}
          />

          <div className="mt-[22px] flex flex-wrap items-start gap-[22px]">
            <TransactionDetails transaction={transaction} />
            <aside className="flex min-w-0 flex-[1_1_380px] flex-col gap-[22px]">
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
