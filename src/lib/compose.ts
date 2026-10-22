import { AmountError, toAmount, type SignedFields } from './signing';

export type Kind = 'transfer' | 'notarize';

// What the person has typed or chosen so far on Sign and send.
export interface Draft {
  kind: Kind;
  to: string;
  amount: string;
  fee: string;
  // The document's SHA-256 in hex, once it is hashed.
  payload: string | null;
}

export interface Checked {
  toOk: boolean;
  amountOk: boolean;
  feeOk: boolean;
  // Whether the balance covers the amount and the fee; true while either is unreadable or the balance unknown.
  covered: boolean;
  // Ready to sign: every check passed and the nonce is known.
  fields: SignedFields | null;
}

const HEX64 = /^[0-9a-f]{64}$/;
const ZERO = '0.00000000';

function amountOrNull(input: string): string | null {
  try {
    return toAmount(input);
  } catch (error) {
    if (error instanceof AmountError) return null;
    throw error;
  }
}

// Checks a draft as the API will, so the page can say what is wrong before anything is signed. The balance is
// only a hint: the API has the last word on funds.
export function checkDraft(draft: Draft, sender: string, nonce: number | null, balance: number | null): Checked {
  const transfer = draft.kind === 'transfer';
  const amount = transfer ? amountOrNull(draft.amount) : ZERO;
  const fee = amountOrNull(draft.fee);
  const covered = amount === null || fee === null || balance === null || Number(amount) + Number(fee) <= balance + 1e-9;
  const toOk = !transfer || HEX64.test(draft.to);
  const amountOk = amount !== null && (!transfer || amount !== ZERO) && covered;
  const feeOk = fee !== null;
  const payload = transfer ? undefined : draft.payload;

  if (!toOk || !amountOk || !feeOk || amount === null || fee === null || nonce === null || payload === null) {
    return { toOk, amountOk, feeOk, covered, fields: null };
  }
  return {
    toOk,
    amountOk,
    feeOk,
    covered,
    fields: { sender_address: sender, receiver_address: transfer ? draft.to : sender, amount, fee, nonce, payload },
  };
}

// The message as it will be signed, one key per line in the canonical order, with "?" or "…" where a value is
// still missing. Once the draft is complete these lines are exactly buildSignedMessage's output.
export function messageLines(draft: Draft, sender: string, nonce: number | null): [key: string, json: string][] {
  const transfer = draft.kind === 'transfer';
  const lines: [string, string][] = [
    ['amount', JSON.stringify(transfer ? (amountOrNull(draft.amount) ?? '?') : ZERO)],
    ['fee', JSON.stringify(amountOrNull(draft.fee) ?? '?')],
    ['nonce', nonce === null ? '…' : String(nonce)],
  ];
  if (!transfer) lines.push(['payload', JSON.stringify(draft.payload ?? '…')]);
  lines.push(['receiver_address', JSON.stringify(transfer ? draft.to || '…' : sender)], ['sender_address', JSON.stringify(sender)]);
  return lines;
}
