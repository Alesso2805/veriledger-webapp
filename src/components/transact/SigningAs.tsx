import { formatAmount, shortHash } from '../../lib/format';
import { Fingerprint } from '../Fingerprint';
import { useT } from '../useT';

// The key this tab signs with, and what the node says the address holds (null while it is being read).
export function SigningAs({ address, balance }: { address: string; balance: number | 'unknown' | null }) {
  const words = useT().transact;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[18px] bg-vl-bg p-3.5">
      <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-1.5">
        <span className="text-sm text-vl-muted">{words.signingAs}</span>
        <Fingerprint hex={address} bars={8} className="h-3.5 max-w-[200px] gap-[2px]" radius={3} />
        <span className="font-vl-mono text-[13px]" title={address}>
          {shortHash(address, 8)}
        </span>
      </span>
      <span className="text-right">
        <span className="block text-sm text-vl-muted">{words.available}</span>
        <span className="block text-2xl font-extrabold tracking-[-0.02em] whitespace-nowrap">
          {balance === null ? (
            '—'
          ) : balance === 'unknown' ? (
            words.unknown
          ) : (
            <>
              {formatAmount(balance)} <span className="text-[15px]">VL</span>
            </>
          )}
        </span>
      </span>
    </div>
  );
}
