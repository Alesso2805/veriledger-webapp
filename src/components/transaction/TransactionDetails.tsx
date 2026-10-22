import { useEffect, useState } from 'react';
import { formatAmount, shortHash, transactionKind } from '../../lib/format';
import { checkSignature, type SignatureCheck } from '../../lib/transaction';
import type { Transaction } from '../../types/ledger';

const SIGNATURE_LINE: Record<SignatureCheck, string> = {
  valid: 'Signature checked in this browser against the sender’s address',
  invalid: 'The signature does not match this transaction and the sender’s address',
  reward: 'A mining reward has no signature: the block’s proof of work seals it',
  'no-nonce': 'Signed before nonces existed, so this browser cannot check it',
  'cannot-rebuild': 'This browser cannot spell the amounts back as they were signed, so it cannot check it',
};

function signatureIcon(check: SignatureCheck) {
  if (check === 'valid') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
        <circle cx="8" cy="8" r="8" className="fill-vl-ok" />
        <path d="M4.5 8.5l2.2 2.2L11.5 6" fill="none" strokeWidth="1.8" className="stroke-vl-on-accent" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <circle cx="8" cy="8" r="8" className={check === 'invalid' ? 'fill-vl-danger' : 'fill-vl-line'} />
      <path d="M8 4.5v4.5M8 11v.5" fill="none" strokeWidth="1.8" className="stroke-vl-on-accent" />
    </svg>
  );
}

export function TransactionDetails({ transaction }: { transaction: Transaction }) {
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

  const mono = 'font-vl-mono text-xs [overflow-wrap:anywhere]';
  const rows: [string, string, string][] = [
    ['Hash', transaction.tx_hash ?? '—', mono],
    ['From', shortHash(transaction.sender_address, 8, 16), mono],
    ['To', notarization ? 'the same address' : shortHash(transaction.receiver_address, 8, 16), notarization ? 'text-sm' : mono],
    ...(notarization ? [['Document', shortHash(transaction.payload ?? '', 8), mono] as [string, string, string]] : []),
    ['Amount', `${formatAmount(transaction.amount)} VL`, 'font-vl-mono text-[13px]'],
    ['Fee', `${formatAmount(transaction.fee)} VL`, 'font-vl-mono text-[13px]'],
    ['Nonce', typeof transaction.nonce === 'number' ? String(transaction.nonce) : '—', 'font-vl-mono text-[13px]'],
    ['Signature', check === 'reward' ? 'none' : `Ed25519 · ${shortHash(transaction.signature ?? '', 8, 12)}`, mono],
  ];

  return (
    <section
      aria-labelledby="details-h"
      className="min-w-0 flex-[999_1_560px] rounded-2xl border border-vl-line bg-vl-surface p-[22px]"
    >
      <h2 id="details-h" className="mb-3.5 text-[15px] font-semibold">
        Details
      </h2>
      <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
        {rows.map(([label, value, className]) => (
          <div key={label} className="contents">
            <dt className="text-vl-muted">{label}</dt>
            <dd className={className}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-vl-line pt-3.5">
        <span className={`flex items-center gap-2 text-sm ${check === 'invalid' ? 'text-vl-danger' : ''}`}>
          {signatureIcon(check)}
          {SIGNATURE_LINE[check]}
        </span>
        <button
          type="button"
          onClick={copy}
          className="h-10 min-w-[150px] rounded-[10px] border border-vl-line px-3.5 text-sm font-semibold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
        >
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>
    </section>
  );
}
