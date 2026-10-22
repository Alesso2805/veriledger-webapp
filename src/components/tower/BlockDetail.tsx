import { useEffect, useState } from 'react';
import { rewardFirst } from '../../lib/chain';
import { formatCount, formatSealed, splitProofOfWork } from '../../lib/format';
import { detailOf } from '../../services/api';
import { getBlock } from '../../services/ledger';
import type { Block, Transaction } from '../../types/ledger';
import { useLanguage, useT } from '../useT';
import { TransactionRow } from './TransactionRow';

type Contents = { transactions: Transaction[] } | { error: string };

// Remounted with a key for each block, so it fades in again and never shows the previous block's transactions.
export function BlockDetail({ block, top }: { block: Block; top: number }) {
  const t = useT();
  const language = useLanguage();
  const failed = t.chain.detail.transactionsFailed;
  const [contents, setContents] = useState<Contents | null>(null);
  const hash = block.block_hash;

  useEffect(() => {
    let active = true;
    getBlock(hash).then(
      (full) => active && setContents({ transactions: rewardFirst(full.transactions) }),
      (error: unknown) => active && setContents({ error: detailOf(error, failed) }),
    );
    return () => {
      active = false;
    };
  }, [hash, failed]);

  const [zeros, rest] = splitProofOfWork(hash);
  const above = top - block.block_number;
  const mono = 'font-vl-mono text-[11px] [overflow-wrap:anywhere]';

  return (
    <div className="animate-vl-fade-up">
      <p className="text-[13px] text-vl-muted">{t.chain.detail.block}</p>
      <h2 id="detail-h" className="text-[44px] leading-[1.1] font-bold tracking-[-0.03em]">
        #{block.block_number}
      </h2>
      <dl className="mt-[18px] grid grid-cols-[92px_minmax(0,1fr)] gap-x-3.5 gap-y-2.5 text-sm">
        <dt className="text-vl-muted">{t.chain.detail.hash}</dt>
        <dd className={mono}>
          <span className="text-vl-accent">{zeros}</span>
          {rest}
        </dd>
        <dt className="text-vl-muted">{t.chain.detail.restsOn}</dt>
        {block.block_number === 0 ? (
          <dd>{t.chain.detail.genesis}</dd>
        ) : (
          <dd className={mono}>
            #{block.block_number - 1} · {block.previous_hash.slice(0, 12)}…
          </dd>
        )}
        <dt className="text-vl-muted">{t.chain.detail.nonce}</dt>
        <dd className="font-vl-mono text-xs">{formatCount(block.nonce, language)}</dd>
        <dt className="text-vl-muted">{t.chain.detail.sealed}</dt>
        <dd>{formatSealed(block.timestamp, undefined, language)}</dd>
        <dt className="text-vl-muted">{t.chain.detail.above}</dt>
        <dd>
          {above === 0 ? t.chain.detail.top : t.chain.detail.blocksAbove(above)}
        </dd>
      </dl>
      <h3 className="mt-[22px] mb-1.5 text-[13px] font-medium text-vl-muted">{t.chain.detail.transactions}</h3>
      {contents === null && (
        <div className="flex flex-col gap-1.5" aria-label={t.chain.detail.loadingTransactions}>
          {block.transaction_ids.slice(0, 3).map((id) => (
            <span key={id} className="h-11 animate-vl-pulse rounded-lg bg-vl-raised" />
          ))}
        </div>
      )}
      {contents && 'error' in contents && (
        <p role="alert" className="text-sm text-vl-danger">
          {contents.error}
        </p>
      )}
      {contents && 'transactions' in contents && (
        <ul>
          {contents.transactions.map((transaction) => (
            <li key={transaction.id} className="border-t border-vl-line-soft">
              <TransactionRow transaction={transaction} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
