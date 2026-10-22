import type { Wallet } from '../types/ledger';
import { keyPairFromSecret } from './keys';

// Why a file is not a key file; the page words it in its language from the dictionary's keyFile texts.
export type KeyFileReason = 'not-json' | 'no-private-key' | 'mismatch';

export class KeyFileError extends Error {
  readonly reason: KeyFileReason;

  constructor(reason: KeyFileReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

// What "Download .json" saves, and what parseKeyFile reads back.
export function keyFileText(pair: Wallet): string {
  return `${JSON.stringify({ public_key: pair.public_key, private_key: pair.private_key }, null, 2)}\n`;
}

const HEX64 = /^[0-9a-f]{64}$/i;

// A key file is the JSON the wallet saves, {"public_key", "private_key"}: raw Ed25519 keys in hex. The public
// key is derived again from the private one, so a file whose halves do not belong together is refused.
export function parseKeyFile(text: string): Wallet {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new KeyFileError('not-json', 'This file is not a key file: it is not JSON.');
  }
  const { public_key: publicKey, private_key: privateKey } = (data ?? {}) as Partial<Record<keyof Wallet, unknown>>;
  if (typeof privateKey !== 'string' || !HEX64.test(privateKey)) {
    throw new KeyFileError('no-private-key', 'This file has no private_key of 64 hex characters.');
  }
  const pair = keyPairFromSecret(privateKey);
  if (publicKey !== undefined && (typeof publicKey !== 'string' || publicKey.toLowerCase() !== pair.public_key)) {
    throw new KeyFileError('mismatch', 'The public_key in this file does not belong to its private_key.');
  }
  return pair;
}
