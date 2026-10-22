import { formatAmount, shortHash } from '../../lib/format';
import { IdentityCube } from '../IdentityCube';
import { useT } from '../useT';

// The key this tab signs with, and what the node says the address holds (null while it is being read).
export function SigningAs({ address, balance }: { address: string; balance: number | 'unknown' | null }) {
  const words = useT().transact;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-vl-bg p-3">
      <IdentityCube address={address} className="h-9 w-10 shrink-0" />
      <span className="min-w-0 flex-auto">
        <span className="block text-[13px] text-vl-muted">{words.signingAs}</span>
        <span className="block font-vl-mono text-xs" title={address}>
          {shortHash(address, 8)}
        </span>
      </span>
      <span className="text-right">
        <span className="block text-[13px] text-vl-muted">{words.available}</span>
        <span className="block font-vl-mono text-sm whitespace-nowrap">
          {balance === null ? '—' : balance === 'unknown' ? words.unknown : `${formatAmount(balance)} VL`}
        </span>
      </span>
    </div>
  );
}
