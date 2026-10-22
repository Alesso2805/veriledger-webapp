import { useEffect, useState } from 'react';
import { PALETTE } from '../../lib/fingerprint';
import { formatAmount, shortHash, transactionKind } from '../../lib/format';
import { checkSignature, type SignatureCheck } from '../../lib/transaction';
import type { Transaction } from '../../types/ledger';
import { useT } from '../useT';

// The palette's mint with an ink check, the same in both themes, as the canvas draws it.
function signatureIcon(check: SignatureCheck) {
  if (check === 'valid') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0 animate-vl-pop">
        <circle cx="11" cy="11" r="10" style={{ fill: PALETTE[2] }} />
        <path d="M6.5 11.5l3 3 6-6.5" fill="none" strokeWidth="2" style={{ stroke: PALETTE[4] }} />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
      <circle cx="11" cy="11" r="10" className={check === 'invalid' ? 'fill-vl-danger' : 'fill-vl-line'} />
      <path d="M11 6v6.5M11 15v.5" fill="none" strokeWidth="2" className="stroke-vl-on-accent" />
    </svg>
  );
}

export function TransactionDetails({ transaction }: { transaction: Transaction }) {
  const words = useT().transaction.details;
  const [copied, setCopied] = useState(false);
  const check = checkSignature(transaction);
  const notarization = transactionKind(transaction) === 'Notarization';

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    // A browser that refuses the clipboard leaves the button as it was.
    navigator.clipboard?.writeText(window.location.href).then(
      () => setCopied(true),
      () => undefined,
    );
  };

  const mono = 'font-vl-mono text-[13px] [overflow-wrap:anywhere]';
  const figure = 'font-vl-mono text-sm';
  const rows: [string, string, string][] = [
    [words.hash, transaction.tx_hash ?? '—', mono],
    [words.from, shortHash(transaction.sender_address, 8, 16), mono],
    [words.to, notarization ? words.sameAddress : shortHash(transaction.receiver_address, 8, 16), notarization ? '' : mono],
    ...(notarization ? [[words.document, shortHash(transaction.payload ?? '', 8), mono] as [string, string, string]] : []),
    [words.amount, `${formatAmount(transaction.amount)} VL`, figure],
    [words.fee, `${formatAmount(transaction.fee)} VL`, figure],
    [words.nonce, typeof transaction.nonce === 'number' ? String(transaction.nonce) : '—', figure],
    [words.signature, check === 'reward' ? words.none : `Ed25519 · ${shortHash(transaction.signature ?? '', 8, 12)}`, mono],
  ];

  return (
    <section aria-labelledby="details-h" className="min-w-0 flex-[999_1_560px] rounded-3xl bg-vl-surface p-6 max-sm:p-[18px]">
      <h2 id="details-h" className="mb-3.5 text-[22px] font-bold tracking-[-0.02em]">
        {words.title}
      </h2>
      <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-3 text-[15px]">
        {rows.map(([label, value, className]) => (
          <div key={label} className="contents">
            <dt className="text-vl-muted">{label}</dt>
            <dd className={className}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-[18px] flex flex-wrap items-center justify-between gap-3 border-t border-vl-line-soft pt-4">
        <span
          className={`flex min-w-0 flex-[1_1_260px] items-center gap-2.5 text-[15px] ${check === 'invalid' ? 'text-vl-danger' : ''}`}
        >
          {signatureIcon(check)}
          {words.check[check]}
        </span>
        <button
          type="button"
          onClick={copy}
          className="h-[46px] min-w-[150px] rounded-[14px] border-[1.5px] border-vl-line px-4 text-[15px] font-bold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
        >
          {copied ? words.copied : words.copy}
        </button>
      </div>
    </section>
  );
}
