import type { Transaction } from '../types/ledger';
import { formatAmount, shortHash, transactionKind } from './format';

// Sums in whole units of 10^-8, so that adding amounts that came as floats does not drift.
const units = (value: number) => Math.round(value * 1e8);
const amount = (value: number) => formatAmount(value / 1e8);

export interface ActivityRow {
  title: string;
  detail: string;
  // How the transaction changes this address's balance, with its sign: "+50.00", "−5.10".
  change: string;
  status: string;
}

// One line of an address's activity, worded as the artboard words it.
export function activityRow(address: string, transaction: Transaction): ActivityRow {
  const status =
    transaction.status === 'PENDING'
      ? 'Waiting'
      : transaction.status === 'FAILED'
        ? 'Failed'
        : typeof transaction.block_number === 'number'
          ? `Block #${transaction.block_number}`
          : 'Sealed';
  const fee = units(transaction.fee);
  const kind = transactionKind(transaction);

  if (kind === 'Mining reward') {
    return { title: 'Mining reward', detail: status, change: `+${amount(units(transaction.amount))}`, status };
  }
  if (kind === 'Notarization') {
    return {
      title: 'Notarized a document',
      detail: `${shortHash(transaction.payload ?? '', 8)} · fee ${amount(fee)}`,
      change: `−${amount(fee)}`,
      status,
    };
  }
  if (transaction.sender_address !== address) {
    return {
      title: `Received from ${shortHash(transaction.sender_address)}`,
      detail: `fee ${amount(fee)}, paid by the sender`,
      change: `+${amount(units(transaction.amount))}`,
      status,
    };
  }
  // Sending to itself costs only the fee.
  const spent = transaction.receiver_address === address ? fee : units(transaction.amount) + fee;
  const to = transaction.receiver_address === address ? 'this address' : shortHash(transaction.receiver_address);
  return { title: `Sent to ${to}`, detail: `fee ${amount(fee)}`, change: `−${amount(spent)}`, status };
}

// "100.00 received · 5.30 sent · 0.20 waiting", from the whole activity of the address. Received counts what
// arrived in sealed blocks, sent what left in them, and waiting what is leaving but not sealed yet.
export function activitySummary(address: string, transactions: Transaction[]): string {
  if (transactions.length === 0) return 'New address: nothing received yet';
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
  return `${amount(received)} received · ${amount(sent)} sent · ${amount(waiting)} waiting`;
}
