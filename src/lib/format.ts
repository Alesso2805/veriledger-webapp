import type { Transaction } from '../types/ledger';
import type { Language } from '../types/preferences';
import { DATE_LOCALE, NUMBER_LOCALE } from './i18n';

const AMOUNT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });

// Responses carry amounts as numbers: at least 2 decimals, and up to the 8 the ledger keeps. Amounts keep the
// API's spelling, with a point, in both languages: they are what is signed (ADR-0007).
export function formatAmount(amount: number): string {
  return AMOUNT.format(amount);
}

// Counts and nonces follow the page's language: 277,786 and 277.786.
export function formatCount(value: number, language: Language = 'en'): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[language]).format(value);
}

// "4655ec4f…a19d" tells addresses and hashes apart in a list; the full value is on the detail. The artboards
// keep more or fewer characters where it matters: 8 at the end for the key a page signs with, 4 and 4 in a title.
export function shortHash(value: string, tail = 4, head = 8): string {
  return value.length > head + tail + 2 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value;
}

// The leading zeros are the proof of work, which the chain highlights.
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

// `document` is the word in the page's language.
export function transactionRoute(transaction: Described, document = 'document'): string {
  if (transactionKind(transaction) === 'Notarization') return `${document} ${shortHash(transaction.payload ?? '')}`;
  return `${shortHash(transaction.sender_address)} → ${shortHash(transaction.receiver_address)}`;
}

// Intl throws on an invalid date, and a throw while drawing takes the whole page down: a time the browser cannot
// read is written as a dash instead.
function readable(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

// In the reader's own time zone; tests pass one so they do not depend on the machine's. "20 Oct 2026", "20 oct 2026".
export function formatSealed(iso: string, timeZone?: string, language: Language = 'en'): string {
  const date = readable(iso);
  if (!date) return '—';
  const day = new Intl.DateTimeFormat(DATE_LOCALE[language], { day: 'numeric', month: 'short', year: 'numeric', timeZone });
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone });
  return `${day.format(date)} · ${time.format(date)}`;
}

// The moment a certificate states, always in UTC; the dictionary words it: "20 October 2026 at 16:21:55 UTC",
// "20 de octubre de 2026 a las 16:21:55 UTC". null when the time cannot be read, so the certificate states no
// moment rather than a dash.
export function certifiedParts(iso: string, language: Language = 'en'): { day: string; time: string } | null {
  const date = readable(iso);
  if (!date) return null;
  const day = new Intl.DateTimeFormat(DATE_LOCALE[language], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });
  return { day: day.format(date), time: time.format(date) };
}

// Seconds with one decimal in the page's language: "1.2", "1,2".
export function formatSeconds(ms: number, language: Language = 'en'): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[language], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ms / 1000);
}

// What the header and the login say about the API. "no database" when it answers but its database does not
// (VLA-26), so the screen never claims the API is unreachable when it is not.
export function healthWord(online: boolean | null, databaseDown: boolean): 'checking' | 'online' | 'offline' | 'no database' {
  if (online === null) return 'checking';
  if (online) return 'online';
  return databaseDown ? 'no database' : 'offline';
}

// What is left of a demo account: hours, then minutes in its last hour (VLW-34). The words are the dictionary's.
export function timeLeft(ms: number): { hours: number } | { minutes: number } {
  if (ms >= 3_600_000) return { hours: Math.floor(ms / 3_600_000) };
  return { minutes: Math.max(1, Math.ceil(ms / 60_000)) };
}

export function formatClock(iso: string, timeZone?: string): string {
  const date = readable(iso);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(date);
}
