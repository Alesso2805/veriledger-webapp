import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { formatAmount } from '../../lib/format';
import { fingerprintGroups } from '../../lib/transaction';
import { Fingerprint } from '../Fingerprint';
import { useT } from '../useT';

interface Props {
  address: string;
  // The fingerprint's bars grow in only when the key was just created or opened on this page.
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
      className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 rounded-[28px] bg-vl-surface p-[30px] max-sm:p-5"
    >
      <Fingerprint hex={address} bars={12} className="h-20 gap-1" radius={6} grow={fresh} stagger={45} />
      <div>
        <h2 id="id-h" className="mb-2 text-[15px] font-medium text-vl-muted">
          {words.address}
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className="flex min-w-0 flex-[1_1_380px] flex-wrap gap-x-3 gap-y-1 font-vl-mono">
            {fingerprintGroups(address).map((group, index) => (
              <span key={index}>{group}</span>
            ))}
          </p>
          <button
            type="button"
            onClick={copy}
            className={`h-[46px] min-w-[140px] rounded-[14px] px-4 text-[15px] font-bold transition-colors duration-(--vl-dur-base) ${
              copied ? 'bg-vl-strong text-vl-on-strong' : 'bg-vl-bg'
            }`}
          >
            {copied ? words.copied : words.copy}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-7 gap-y-[18px] border-t border-vl-line-soft pt-[22px]">
        <div>
          <p className="text-[15px] font-medium text-vl-muted">{words.available}</p>
          <p className="text-[68px] leading-none font-extrabold tracking-[-0.04em] tabular-nums max-sm:text-[52px]">
            {/* Pops when the balance arrives, and only then. */}
            <span key={String(balance)} className={`inline-block ${typeof balance === 'number' ? 'animate-vl-pop' : ''}`}>
              {typeof balance === 'number' ? formatAmount(balance) : '—'}
            </span>{' '}
            <span className="text-[26px] tracking-[-0.01em]">VL</span>
          </p>
          {balance === 'unknown' && <p className="mt-2.5 text-[13px] text-vl-muted">{words.noBalance}</p>}
          {note && <p className="mt-2.5 font-vl-mono text-[13px] text-vl-muted">{note}</p>}
        </div>
        <Link to="/transact" className="flex h-[52px] items-center rounded-2xl bg-vl-accent px-6 font-bold text-vl-on-accent">
          {words.signAndSend}
        </Link>
      </div>
    </section>
  );
}
