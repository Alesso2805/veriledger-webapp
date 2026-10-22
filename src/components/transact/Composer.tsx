import { useEffect, useState } from 'react';
import { checkDraft, messageLines, type Draft } from '../../lib/compose';
import { refusalKind } from '../../lib/refusal';
import { buildSignedMessage, signMessage } from '../../lib/signing';
import { detailOf, statusOf } from '../../services/api';
import { sendTransaction } from '../../services/ledger';
import { getBalance, getNextNonce } from '../../services/wallets';
import type { Transaction, Wallet } from '../../types/ledger';
import { Accepted } from './Accepted';
import { DocumentHash } from './DocumentHash';
import { KindSwitch } from './KindSwitch';
import { SignaturePanel } from './SignaturePanel';
import { SignedMessage } from './SignedMessage';
import { SigningAs } from './SigningAs';
import { useT } from '../useT';

const EMPTY: Draft = { kind: 'transfer', to: '', amount: '', fee: '0', payload: null };

interface Refusal {
  title: string;
  text: string;
  // A new key replays the shake for every refusal, even one with the same words.
  id: number;
}

const input = (invalid: boolean) =>
  `h-11 w-full rounded-[10px] border bg-vl-bg px-3 font-vl-mono transition-colors duration-(--vl-dur-fast) ${
    invalid ? 'border-vl-danger' : 'border-vl-line'
  }`;

// Remounted for each key (key={public_key}), so a new key starts from an empty draft and reads its own nonce.
export function Composer({ pair }: { pair: Wallet }) {
  const t = useT();
  const words = t.transact;
  const address = pair.public_key;
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [nonce, setNonce] = useState<number | 'unknown' | null>(null);
  const [balance, setBalance] = useState<number | 'unknown' | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [sending, setSending] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [sent, setSent] = useState<Transaction | null>(null);
  // Each "Send another" starts a round, which reads the nonce and the balance again.
  const [round, setRound] = useState(0);

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
  }, [address, round]);

  const knownNonce = typeof nonce === 'number' ? nonce : null;
  const checked = checkDraft(draft, address, knownNonce, typeof balance === 'number' ? balance : null);
  const message = checked.fields ? buildSignedMessage(checked.fields) : null;
  const transfer = draft.kind === 'transfer';
  const toInvalid = draft.to !== '' && !checked.toOk;
  const amountInvalid = transfer && draft.amount !== '' && !checked.amountOk;

  // An edit after signing discards the signature: it no longer matches the message.
  const edit = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setRefusal(null);
    if (signature) {
      setSignature(null);
      setStale(true);
    }
  };

  const sign = () => {
    if (!message) return;
    setSignature(signMessage(message, pair.private_key));
    setStale(false);
    setRefusal(null);
  };

  const send = async () => {
    if (!checked.fields || !signature) return;
    setSending(true);
    try {
      setSent(await sendTransaction(checked.fields, signature));
    } catch (error) {
      const status = statusOf(error);
      const detail = detailOf(error, words.noAnswer);
      let text = detail;
      // Another transaction from this address took the nonce first: read the next one and ask to sign again.
      if (status === 409) {
        const next = await getNextNonce(address).catch(() => null);
        if (next !== null) {
          setNonce(next);
          text = words.nextNonce(detail, next);
        }
      }
      setRefusal((previous) => ({ title: words.refusals[refusalKind(status, detail)], text, id: (previous?.id ?? 0) + 1 }));
      setSignature(null);
    } finally {
      setSending(false);
    }
  };

  const again = () => {
    setDraft((current) => ({ ...current, amount: '', payload: null }));
    setSignature(null);
    setStale(false);
    setSent(null);
    setNonce(null);
    setRound((count) => count + 1);
  };

  const canSign = message !== null && signature === null && !sending;
  const canSend = signature !== null && !sending;

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
              {words.to}
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
              {toInvalid ? words.toInvalid : words.toHelp}
            </p>
          </div>
        ) : (
          <DocumentHash key={`doc-${round}`} onHashed={(payload) => edit({ payload })} />
        )}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label htmlFor="amount" className="mb-1.5 block text-[13px] font-medium">
              {words.amount}
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
              {words.fee}
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
              {words.nonce}
            </label>
            <input id="nonce" readOnly value={nonce ?? '…'} className={`${input(false)} text-sm`} />
          </div>
        </div>
        <p className="-mt-1.5 text-[13px] text-vl-muted">
          {words.nonceHelp}
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
            <span className="block text-vl-muted">{words.sent}</span> {words.theMessage}
          </li>
          <li className="rounded-xl border border-vl-line bg-vl-surface px-3 py-2.5">
            <span className="block text-vl-muted">{words.sent}</span> {words.theSignature}
          </li>
          <li className="rounded-xl border border-vl-accent bg-vl-surface px-3 py-2.5">
            <span className="block text-vl-accent">{words.neverSent}</span> {words.yourKey}
          </li>
        </ul>

        {refusal && (
          <div
            key={refusal.id}
            role="alert"
            className="animate-vl-shake rounded-[14px] border border-vl-danger bg-vl-surface px-4 py-3.5"
          >
            <p className="font-semibold text-vl-danger">{refusal.title}</p>
            <p className="mt-1 text-sm">{refusal.text}</p>
          </div>
        )}

        {sent?.tx_hash ? (
          <Accepted txHash={sent.tx_hash} onAgain={again} />
        ) : (
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={sign}
              disabled={!canSign}
              className={`h-[46px] rounded-[10px] px-[18px] font-semibold transition-colors duration-(--vl-dur-base) ${
                canSign ? 'bg-vl-accent text-vl-on-accent' : 'bg-vl-line text-vl-muted'
              }`}
            >
              {signature ? words.signed : words.sign}
            </button>
            <button
              type="button"
              onClick={() => void send()}
              disabled={!canSend}
              className={`h-[46px] rounded-[10px] border px-[18px] font-semibold transition-colors duration-(--vl-dur-base) ${
                canSend ? 'border-vl-text bg-vl-text text-vl-on-accent' : 'border-vl-line bg-transparent text-vl-faint'
              }`}
            >
              {sending ? words.sending : words.send}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
