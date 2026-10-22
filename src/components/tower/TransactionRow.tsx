import { Link } from 'react-router';
import { formatAmount, transactionKind, transactionRoute } from '../../lib/format';
import type { Transaction } from '../../types/ledger';
import { useT } from '../useT';

// One transaction in the tower's lists, linked to its page by the hash that page looks up (VLA-20).
export function TransactionRow({ transaction, showFee = false }: { transaction: Transaction; showFee?: boolean }) {
  const t = useT();
  // The spaces between spans keep the link's accessible name apart: "Transfer 4655ec4f…a19d → …", not "Transfer4655…".
  const content = (
    <>
      <span>
        <span className="block text-sm font-semibold">{t.kinds[transactionKind(transaction)]}</span>{' '}
        <span className="block font-vl-mono text-[11px] text-vl-muted">{transactionRoute(transaction, t.document)}</span>
      </span>{' '}
      <span className="shrink-0 text-right font-vl-mono text-[13px] whitespace-nowrap">
        {formatAmount(transaction.amount)}{' '}
        {showFee && <span className="block text-[11px] text-vl-muted">{t.chain.waiting.fee(formatAmount(transaction.fee))}</span>}
      </span>
    </>
  );
  const row = 'flex justify-between gap-3 rounded-lg px-1.5 py-2.5';

  if (!transaction.tx_hash) return <div className={row}>{content}</div>;
  return (
    <Link
      to={`/transaction/${transaction.tx_hash}`}
      className={`${row} transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised`}
    >
      {content}
    </Link>
  );
}
