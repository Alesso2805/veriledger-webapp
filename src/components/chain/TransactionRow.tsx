import { Link } from 'react-router';
import { formatAmount, transactionKind, transactionRoute } from '../../lib/format';
import type { Transaction } from '../../types/ledger';
import { Avatar } from '../Avatar';
import { useT } from '../useT';

// One transaction in the chain's lists, linked to its page by the hash that page looks up (VLA-20). The avatar is its
// sender's, or the miner's for a reward, which SYSTEM sends.
export function TransactionRow({ transaction, waiting = false }: { transaction: Transaction; waiting?: boolean }) {
  const t = useT();
  const who = transaction.sender_address === 'SYSTEM' ? transaction.receiver_address : transaction.sender_address;
  // The spaces between spans keep the link's accessible name apart: "Transfer 4655ec4f…a19d → …", not "Transfer4655…".
  const content = (
    <>
      <Avatar hex={who} size={waiting ? 32 : 36} />{' '}
      <span className="min-w-0 flex-auto">
        <span className={`block font-bold ${waiting ? 'text-[15px]' : ''}`}>{t.kinds[transactionKind(transaction)]}</span>{' '}
        <span className={`block font-vl-mono text-vl-muted [overflow-wrap:anywhere] ${waiting ? 'text-[11px]' : 'text-xs'}`}>
          {transactionRoute(transaction, t.document)}
        </span>
      </span>{' '}
      <span className={`text-right font-vl-mono ${waiting ? 'text-[13px]' : 'text-sm'}`}>
        {formatAmount(transaction.amount)}{' '}
        {waiting && (
          <span className="block text-[11px] whitespace-nowrap text-vl-muted">{t.chain.waiting.fee(formatAmount(transaction.fee))}</span>
        )}
      </span>
    </>
  );
  const row = `flex items-center rounded-xl ${waiting ? 'gap-2.5 px-1.5 py-2.5' : 'gap-3 px-2 py-3'}`;

  if (!transaction.tx_hash) return <div className={row}>{content}</div>;
  return (
    <Link to={`/transaction/${transaction.tx_hash}`} className={`${row} transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised`}>
      {content}
    </Link>
  );
}
