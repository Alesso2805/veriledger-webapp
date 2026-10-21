import type { Transaction } from '../types/ledger';
import { formatAmount, shortHash, transactionKind } from './format';
import { buildSignedMessage, verifySignature, type SignedFields } from './signing';

// The fields the sender signed, rebuilt from what the API stored. Responses carry amounts as numbers; with at
// most 8 decimals and 10 integer digits, toFixed(8) gives back the string that was signed. A mining reward has
// no signature, and a row from before VLA-16 has no nonce, so neither can be rebuilt.
export function signedFieldsOf(transaction: Transaction): SignedFields | null {
  if (transaction.sender_address === 'SYSTEM' || typeof transaction.nonce !== 'number') return null;
  return {
    sender_address: transaction.sender_address,
    receiver_address: transaction.receiver_address,
    amount: transaction.amount.toFixed(8),
    fee: transaction.fee.toFixed(8),
    nonce: transaction.nonce,
    payload: transaction.payload ?? undefined,
  };
}

export type SignatureCheck = 'valid' | 'invalid' | 'reward' | 'no-nonce';

// Checked in the browser, so the page does not take the node's word for it.
export function checkSignature(transaction: Transaction): SignatureCheck {
  if (transaction.sender_address === 'SYSTEM') return 'reward';
  const fields = signedFieldsOf(transaction);
  if (!fields) return 'no-nonce';
  const valid = verifySignature(buildSignedMessage(fields), transaction.signature ?? '', transaction.sender_address);
  return valid ? 'valid' : 'invalid';
}

export interface Journey {
  // How many of Signed, Accepted, Sealed and Buried the transaction has reached (1 to 4).
  reached: number;
  // Blocks on top of its block, or null while it waits for one.
  above: number | null;
}

// From the status, the block number and the height. It is Buried once at least one block rests on its own.
export function journeyOf(transaction: Transaction, top: number | null): Journey {
  if (transaction.status !== 'CONFIRMED' || typeof transaction.block_number !== 'number') return { reached: 2, above: null };
  const above = top === null ? 0 : Math.max(0, top - transaction.block_number);
  return { reached: above > 0 ? 4 : 3, above };
}

const title4 = (address: string) => shortHash(address, 4, 4);

export function transactionTitle(transaction: Transaction): string {
  const amount = `${formatAmount(transaction.amount)} VL`;
  switch (transactionKind(transaction)) {
    case 'Mining reward':
      return `A mining reward of ${amount} to ${title4(transaction.receiver_address)}`;
    case 'Notarization':
      return transaction.status === 'PENDING'
        ? 'A document waiting to be sealed'
        : `A document notarized by ${title4(transaction.sender_address)}`;
    case 'Transfer':
      return `${amount} from ${title4(transaction.sender_address)} to ${title4(transaction.receiver_address)}`;
  }
}

export const blocksOnTop = (above: number) =>
  above === 0 ? 'nothing on top yet' : `${above} ${above === 1 ? 'block' : 'blocks'} on top`;
