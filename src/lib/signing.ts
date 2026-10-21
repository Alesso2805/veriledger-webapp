import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, hexToBytes } from '@noble/curves/utils.js';

// The fields a transaction's signature covers (the API's ADR-0004). Amounts are canonical strings, never numbers.
export interface SignedFields {
  sender_address: string;
  receiver_address: string;
  amount: string;
  fee: string;
  // The sender's next nonce from GET /wallets/{address}/nonce, so a captured transaction cannot be replayed.
  nonce: number;
  payload?: string;
}

// Exactly 8 decimals, no leading zeros, at most 10 integer digits: the API's AMOUNT pattern.
export const AMOUNT = /^(0|[1-9]\d{0,9})\.\d{8}$/;

export class AmountError extends Error {}

// Turns what a person typed ("10", "0.5", "007.25") into the one spelling both sides sign, without a float.
export function toAmount(input: string): string {
  const match = /^(\d+)(?:\.(\d*))?$/.exec(input.trim());
  if (!match) throw new AmountError('Enter an amount such as 10 or 0.5');
  const [, integer, decimals = ''] = match;
  if (decimals.length > 8) throw new AmountError('Use at most 8 decimals');
  const amount = `${integer.replace(/^0+(?=\d)/, '')}.${decimals.padEnd(8, '0')}`;
  if (!AMOUNT.test(amount)) throw new AmountError('Use at most 10 digits before the decimal point');
  return amount;
}

// The canonical message: keys sorted by code point, no whitespace, payload left out when absent.
// JSON.stringify writes the same escapes as the API's json.dumps(..., ensure_ascii=False), and integers alike.
export function buildSignedMessage(fields: SignedFields): string {
  for (const name of ['amount', 'fee'] as const) {
    if (!AMOUNT.test(fields[name])) throw new AmountError(`${name} must have exactly 8 decimals, like 10.00000000`);
  }
  // The API refuses anything else with a 422; above 2^53 - 1 the number would not survive JSON on both sides.
  if (!Number.isSafeInteger(fields.nonce) || fields.nonce < 1) throw new RangeError('nonce must be an integer from 1 to 2^53 - 1');
  const entries = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify(Object.fromEntries(entries));
}

// Signs the message's UTF-8 bytes with the raw 32-byte private key; the signature is 64 bytes of hex.
export function signMessage(message: string, privateKey: string): string {
  return bytesToHex(ed25519.sign(new TextEncoder().encode(message), hexToBytes(privateKey)));
}

// Whether the signature is the address's over the message. Malformed hex counts as not signed, never as an error.
export function verifySignature(message: string, signature: string, publicKey: string): boolean {
  try {
    return ed25519.verify(hexToBytes(signature), new TextEncoder().encode(message), hexToBytes(publicKey));
  } catch {
    return false;
  }
}
