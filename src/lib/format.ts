import type { Transaction } from '../types/ledger';

const AMOUNT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
const COUNT = new Intl.NumberFormat('en-US');

// Responses carry amounts as numbers: at least 2 decimals, and up to the 8 the ledger keeps.
export function formatAmount(amount: number): string {
  return AMOUNT.format(amount);
}

export function formatCount(value: number): string {
  return COUNT.format(value);
}

// "4655ec4f…a19d" tells addresses and hashes apart in a list; the full value is on the detail. The artboards
// keep more or fewer characters where it matters: 8 at the end for the key a page signs with, 4 and 4 in a title.
export function shortHash(value: string, tail = 4, head = 8): string {
  return value.length > head + tail + 2 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value;
}

// The leading zeros are the proof of work, which the tower highlights.
export function splitProofOfWork(hash: string): [zeros: string, rest: string] {
  const zeros = hash.length - hash.replace(/^0+/, '').length;
  return [hash.slice(0, zeros), hash.slice(zeros)];
}

export type TransactionKind = 'Mining reward' | 'Notarization' | 'Transfer';

type Described = Pick<Transaction, 'sender_address' | 'receiver_address' | 'amount' | 'payload'>;

// The API sends the reward from SYSTEM; a notarization sends 0 with the document's hash as its payload.
export function transactionKind(transaction: Described): TransactionKind {
  if (transaction.sender_address === 'SYSTEM') return 'Mining reward';
  if (transaction.amount === 0 && transaction.payload) return 'Notarization';
  return 'Transfer';
}

export function transactionRoute(transaction: Described): string {
  if (transactionKind(transaction) === 'Notarization') return `document ${shortHash(transaction.payload ?? '')}`;
  return `${shortHash(transaction.sender_address)} → ${shortHash(transaction.receiver_address)}`;
}

// In the reader's own time zone; tests pass one so they do not depend on the machine's.
export function formatSealed(iso: string, timeZone?: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone });
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone });
  return `${day.format(date)} · ${time.format(date)}`;
}

export function formatClock(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(new Date(iso));
}
