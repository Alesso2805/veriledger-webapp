import type { Transaction } from '../types/ledger';
import { formatAmount, shortHash, transactionKind } from './format';
import { en, type Messages } from './i18n/en';

type Words = Messages['wallet']['activity'];

// Sums in whole units of 10^-8, so that adding amounts that came as floats does not drift.
const units = (value: number) => Math.round(value * 1e8);
const amount = (value: number) => formatAmount(value / 1e8);

export interface ActivityRow {
  title: string;
  detail: string;
  // How the transaction changes this address's balance, with its sign: "+50.00", "−5.10".
  change: string;
  status: string;
  // The address whose avatar stands beside the line: the other side of a transfer, else this address.
  peer: string;
}

// One line of an address's activity, worded as the artboard words it, in the page's language (`words`).
export function activityRow(address: string, transaction: Transaction, words: Words = en.wallet.activity): ActivityRow {
  const status =
    transaction.status === 'PENDING'
      ? words.waiting
      : transaction.status === 'FAILED'
        ? words.failed
        : typeof transaction.block_number === 'number'
          ? words.block(transaction.block_number)
          : words.sealed;
  const fee = units(transaction.fee);
  const kind = transactionKind(transaction);

  if (kind === 'Mining reward') {
    return { title: words.reward, detail: status, change: `+${amount(units(transaction.amount))}`, status, peer: address };
  }
  if (kind === 'Notarization') {
    return {
      title: words.notarized,
      detail: `${shortHash(transaction.payload ?? '', 8)} · ${words.fee(amount(fee))}`,
      change: `−${amount(fee)}`,
      status,
      peer: address,
    };
  }
  if (transaction.sender_address !== address) {
    return {
      title: words.received(shortHash(transaction.sender_address)),
      detail: words.feePaid(amount(fee)),
      change: `+${amount(units(transaction.amount))}`,
      status,
      peer: transaction.sender_address,
    };
  }
  // Sending to itself costs only the fee.
  const spent = transaction.receiver_address === address ? fee : units(transaction.amount) + fee;
  const to = transaction.receiver_address === address ? words.thisAddress : shortHash(transaction.receiver_address);
  return { title: words.sent(to), detail: words.fee(amount(fee)), change: `−${amount(spent)}`, status, peer: transaction.receiver_address };
}

// "100.00 received · 5.30 sent · 0.20 waiting", from the whole activity of the address. Received counts what
// arrived in sealed blocks, sent what left in them, and waiting what is leaving but not sealed yet.
export function activitySummary(address: string, transactions: Transaction[], words: Words = en.wallet.activity): string {
  if (transactions.length === 0) return words.newAddress;
  let received = 0;
  let sent = 0;
  let waiting = 0;
  for (const transaction of transactions) {
    if (transaction.status === 'FAILED') continue;
    const confirmed = transaction.status === 'CONFIRMED';
    if (transaction.sender_address === address) {
      const spent = (transaction.receiver_address === address ? 0 : units(transaction.amount)) + units(transaction.fee);
      if (confirmed) sent += spent;
      else waiting += spent;
    } else if (confirmed) {
      received += units(transaction.amount);
    }
  }
  return words.summary(amount(received), amount(sent), amount(waiting));
}
