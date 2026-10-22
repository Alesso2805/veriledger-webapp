import { useEffect, useState } from 'react';
import { rewardFirst } from '../../lib/chain';
import { afterProofOfWork } from '../../lib/fingerprint';
import { formatCount, formatSealed, splitProofOfWork } from '../../lib/format';
import { detailOf } from '../../services/api';
import { getBlock } from '../../services/ledger';
import type { Block, Transaction } from '../../types/ledger';
import { Fingerprint } from '../Fingerprint';
import { useLanguage, useT } from '../useT';
import { TransactionRow } from './TransactionRow';

type Contents = { transactions: Transaction[] } | { error: string };

// Remounted with a key for each block, so it fades in again and never shows the previous block's transactions.
export function BlockDetail({ block, top }: { block: Block; top: number }) {
  const t = useT();
  const words = t.chain.detail;
  const language = useLanguage();
  const [contents, setContents] = useState<Contents | null>(null);
  const hash = block.block_hash;
  const failed = words.transactionsFailed;

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
  const after = top - block.block_number;

  return (
    <div className="animate-vl-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
        <div>
          <p className="text-sm text-vl-muted">{words.block}</p>
          <h2 id="detail-h" className="text-5xl leading-none font-extrabold tracking-[-0.035em]">
            #{block.block_number}
          </h2>
        </div>
        <Fingerprint hex={rest} bars={8} className="h-9 flex-[0_1_280px] gap-[3px]" radius={5} />
      </div>
      <dl className="mt-[18px] grid grid-cols-[96px_minmax(0,1fr)] gap-x-3.5 gap-y-2.5 text-[15px]">
        <dt className="text-vl-muted">{words.hash}</dt>
        <dd className="font-vl-mono text-xs [overflow-wrap:anywhere]">
          <span className="font-medium text-vl-accent">{zeros}</span>
          {rest}
        </dd>
        <dt className="text-vl-muted">{words.linksTo}</dt>
        {block.block_number === 0 ? (
          <dd>{words.genesis}</dd>
        ) : (
          <dd className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <Fingerprint hex={afterProofOfWork(block.previous_hash)} bars={8} className="h-3 w-[72px] gap-[2px]" radius={2} />
            <span className="font-vl-mono text-xs [overflow-wrap:anywhere]">
              #{block.block_number - 1} · {block.previous_hash.slice(0, 12)}…
            </span>
          </dd>
        )}
        <dt className="text-vl-muted">{words.nonce}</dt>
        <dd className="font-vl-mono text-[13px]">{formatCount(block.nonce, language)}</dd>
        <dt className="text-vl-muted">{words.sealed}</dt>
        <dd>{formatSealed(block.timestamp, undefined, language)}</dd>
        <dt className="text-vl-muted">{words.after}</dt>
        <dd>{after === 0 ? words.newest : words.blocksAfter(after)}</dd>
      </dl>
      <h3 className="mt-[22px] mb-1 text-sm font-medium text-vl-muted">{words.transactions}</h3>
      {contents === null && (
        <div className="flex flex-col gap-1.5" aria-label={words.loadingTransactions}>
          {block.transaction_ids.slice(0, 3).map((id) => (
            <span key={id} className="h-[60px] animate-vl-pulse rounded-xl bg-vl-skeleton" />
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
