import { useEffect, useState } from 'react';
import { formatAmount, shortHash } from '../../lib/format';
import { getBalance } from '../../services/wallets';
import { IdentityCube } from '../IdentityCube';

// The key this tab signs with, and what the node says the address holds.
export function SigningAs({ address }: { address: string }) {
  const [balance, setBalance] = useState<number | 'unknown' | null>(null);

  useEffect(() => {
    let active = true;
    getBalance(address).then(
      (amount) => active && setBalance(amount),
      () => active && setBalance('unknown'),
    );
    return () => {
      active = false;
    };
  }, [address]);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-vl-bg p-3">
      <IdentityCube address={address} className="h-9 w-10 shrink-0" />
      <span className="min-w-0 flex-auto">
        <span className="block text-[13px] text-vl-muted">Signing as</span>
        <span className="block font-vl-mono text-xs" title={address}>
          {shortHash(address, 8)}
        </span>
      </span>
      <span className="text-right">
        <span className="block text-[13px] text-vl-muted">Available</span>
        <span className="block font-vl-mono text-sm whitespace-nowrap">
          {balance === null ? '—' : balance === 'unknown' ? 'unknown' : `${formatAmount(balance)} VL`}
        </span>
      </span>
    </div>
  );
}
