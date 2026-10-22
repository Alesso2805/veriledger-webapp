import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { formatAmount } from '../../lib/format';
import { fingerprintGroups } from '../../lib/transaction';
import { IdentityCube } from '../IdentityCube';
import { useT } from '../useT';

interface Props {
  address: string;
  // The cube drops in only when the key was just created or opened on this page.
  fresh: boolean;
  balance: number | 'unknown' | null;
  // What the activity adds up to, when the whole of it is loaded.
  note: string | null;
}

export function IdentityCard({ address, fresh, balance, note }: Props) {
  const words = useT().wallet;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    navigator.clipboard?.writeText(address).then(
      () => setCopied(true),
      () => undefined,
    );
  };

  return (
    <section
      aria-labelledby="id-h"
      className="flex min-w-0 flex-[999_1_560px] flex-wrap items-center gap-6 rounded-2xl border border-vl-line bg-vl-surface p-6"
    >
      <IdentityCube
        address={address}
        size="large"
        className={`h-[120px] w-[132px] shrink-0 overflow-visible ${fresh ? 'animate-vl-drop' : ''}`}
      />
      <div className="min-w-0 flex-[1_1_320px]">
        <h2 id="id-h" className="text-[13px] font-medium text-vl-muted">
          {words.address}
        </h2>
        <p className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 font-vl-mono text-sm">
          {fingerprintGroups(address).map((group, index) => (
            <span key={index}>{group}</span>
          ))}
        </p>
        <div className="mt-[18px] flex flex-wrap items-end justify-between gap-3.5">
          <div>
            <p className="text-[13px] text-vl-muted">{words.available}</p>
            <p className="font-vl-mono text-[40px] leading-[1.1] font-medium">
              {/* Pops when the balance arrives, and only then. */}
              <span key={String(balance)} className={`inline-block ${typeof balance === 'number' ? 'animate-vl-pop' : ''}`}>
                {typeof balance === 'number' ? formatAmount(balance) : '—'}
              </span>{' '}
              <span className="text-base">VL</span>
            </p>
            {balance === 'unknown' && <p className="mt-1 text-[13px] text-vl-muted">{words.noBalance}</p>}
            {note && <p className="mt-1 font-vl-mono text-[11px] text-vl-muted">{note}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="h-[42px] min-w-[132px] rounded-[10px] border border-vl-line px-3.5 text-sm font-semibold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
            >
              {copied ? words.copied : words.copy}
            </button>
            <Link
              to="/transact"
              className="inline-flex h-[42px] items-center rounded-[10px] bg-vl-accent px-3.5 font-semibold text-vl-on-accent"
            >
              {words.signAndSend}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
