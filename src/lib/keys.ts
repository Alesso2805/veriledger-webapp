import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, hexToBytes } from '@noble/curves/utils.js';
import type { Wallet } from '../types/ledger';

// Raw 32-byte Ed25519 keys in lowercase hex: the format the API verifies (SPEC › Signing contract).
export function keyPairFromSecret(privateKey: string): Wallet {
  return {
    private_key: privateKey.toLowerCase(),
    public_key: bytesToHex(ed25519.getPublicKey(hexToBytes(privateKey))),
  };
}

// The secret comes from the browser's CSPRNG and is never sent anywhere (ADR-0002).
export function generateKeyPair(): Wallet {
  return keyPairFromSecret(bytesToHex(ed25519.utils.randomSecretKey()));
}
