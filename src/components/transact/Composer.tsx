import { useEffect, useState } from 'react';
import { checkDraft, messageLines, type Draft } from '../../lib/compose';
import { buildSignedMessage, signMessage } from '../../lib/signing';
import { getBalance, getNextNonce } from '../../services/wallets';
import type { Wallet } from '../../types/ledger';
import { DocumentHash } from './DocumentHash';
import { KindSwitch } from './KindSwitch';
import { SignaturePanel } from './SignaturePanel';
import { SignedMessage } from './SignedMessage';
import { SigningAs } from './SigningAs';

const EMPTY: Draft = { kind: 'transfer', to: '', amount: '', fee: '0', payload: null };

const input = (invalid: boolean) =>
  `h-11 w-full rounded-[10px] border bg-vl-bg px-3 font-vl-mono transition-colors duration-(--vl-dur-fast) ${
    invalid ? 'border-vl-danger' : 'border-vl-line'
  }`;

// Remounted for each key (key={public_key}), so a new key starts from an empty draft and reads its own nonce.
export function Composer({ pair }: { pair: Wallet }) {
  const address = pair.public_key;
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [nonce, setNonce] = useState<number | 'unknown' | null>(null);
  const [balance, setBalance] = useState<number | 'unknown' | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let active = true;
    getNextNonce(address).then(
      (next) => active && setNonce(next),
      () => active && setNonce('unknown'),
    );
    getBalance(address).then(
      (amount) => active && setBalance(amount),
      () => active && setBalance('unknown'),
    );
    return () => {
      active = false;
    };
  }, [address]);

  const knownNonce = typeof nonce === 'number' ? nonce : null;
  const checked = checkDraft(draft, address, knownNonce, typeof balance === 'number' ? balance : null);
  const message = checked.fields ? buildSignedMessage(checked.fields) : null;
  const transfer = draft.kind === 'transfer';
  const toInvalid = draft.to !== '' && !checked.toOk;
  const amountInvalid = transfer && draft.amount !== '' && !checked.amountOk;

  // An edit after signing discards the signature: it no longer matches the message.
  const edit = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    if (signature) {
      setSignature(null);
      setStale(true);
    }
  };

  const sign = () => {
    if (!message) return;
    setSignature(signMessage(message, pair.private_key));
    setStale(false);
  };
  const canSign = message !== null && signature === null;

  return (
    <div className="mt-6 flex flex-wrap items-start gap-5">
      <form
        onSubmit={(event) => event.preventDefault()}
        className="flex min-w-0 flex-[1_1_420px] flex-col gap-4 rounded-2xl border border-vl-line bg-vl-surface p-5"
      >
        <SigningAs address={address} balance={balance} />
        {/* A new kind starts without a document, so the note and the payload always agree. */}
        <KindSwitch kind={draft.kind} onChange={(kind) => edit({ kind, payload: null })} />
        {transfer ? (
          <div key="to" className="animate-vl-fade-up">
            <label htmlFor="to" className="mb-1.5 block text-[13px] font-medium">
              To
            </label>
            <input
              id="to"
              value={draft.to}
              onChange={(event) => edit({ to: event.target.value.trim().toLowerCase() })}
              aria-invalid={toInvalid}
              aria-describedby="to-help"
              autoComplete="off"
              spellCheck={false}
              className={`${input(toInvalid)} text-xs`}
            />
            <p id="to-help" className={`mt-1.5 text-[13px] ${toInvalid ? 'text-vl-danger' : 'text-vl-muted'}`}>
              {toInvalid ? 'An address has 64 characters from 0–9 and a–f.' : 'A 64-character address.'}
            </p>
          </div>
        ) : (
          <DocumentHash key="doc" onHashed={(payload) => edit({ payload })} />
        )}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label htmlFor="amount" className="mb-1.5 block text-[13px] font-medium">
              Amount
            </label>
            {transfer ? (
              <input
                id="amount"
                inputMode="decimal"
                value={draft.amount}
                onChange={(event) => edit({ amount: event.target.value })}
                aria-invalid={amountInvalid}
                className={`${input(amountInvalid)} text-sm`}
              />
            ) : (
              <input id="amount" readOnly value="0.00" className={`${input(false)} text-sm text-vl-muted`} />
            )}
          </div>
          <div>
            <label htmlFor="fee" className="mb-1.5 block text-[13px] font-medium">
              Fee
            </label>
            <input
              id="fee"
              inputMode="decimal"
              value={draft.fee}
              onChange={(event) => edit({ fee: event.target.value })}
              aria-invalid={!checked.feeOk}
              className={`${input(!checked.feeOk)} text-sm`}
            />
          </div>
          <div>
            <label htmlFor="nonce" className="mb-1.5 block text-[13px] font-medium">
              Nonce
            </label>
            <input id="nonce" readOnly value={nonce ?? '…'} className={`${input(false)} text-sm`} />
          </div>
        </div>
        <p className="-mt-1.5 text-[13px] text-vl-muted">
          The nonce is this address’s next number, read from the node. A signed message works only once.
        </p>
      </form>

      <section aria-labelledby="msg-h" className="flex min-w-0 flex-[999_1_520px] flex-col gap-3.5">
        <SignedMessage
          lines={messageLines(draft, address, knownNonce)}
          bytes={message === null ? null : new TextEncoder().encode(message).length}
        />
        <SignaturePanel signature={signature} stale={stale} />
        <ul className="grid grid-cols-3 gap-2 text-[13px]">
          <li className="rounded-xl border border-vl-line bg-vl-surface px-3 py-2.5">
            <span className="block text-vl-muted">Sent</span> The message
          </li>
          <li className="rounded-xl border border-vl-line bg-vl-surface px-3 py-2.5">
            <span className="block text-vl-muted">Sent</span> The signature
          </li>
          <li className="rounded-xl border border-vl-accent bg-vl-surface px-3 py-2.5">
            <span className="block text-vl-accent">Never sent</span> Your private key
          </li>
        </ul>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={sign}
            disabled={!canSign}
            className={`h-[46px] rounded-[10px] px-[18px] font-semibold transition-colors duration-(--vl-dur-base) ${
              canSign ? 'bg-vl-accent text-vl-on-accent' : 'bg-vl-line text-vl-muted'
            }`}
          >
            {signature ? 'Signed' : 'Sign with this key'}
          </button>
        </div>
      </section>
    </div>
  );
}
