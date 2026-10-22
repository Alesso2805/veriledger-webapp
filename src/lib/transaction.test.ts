import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types/ledger';
import vectors from './__fixtures__/signing-vectors.json';
import { en } from './i18n/en';
import { es } from './i18n/es';
import { checkSignature, fingerprintGroups, journeyOf, signedFieldsOf, transactionTitle } from './transaction';

const vector = (name: string) => vectors.vectors.find((candidate) => candidate.name === name)!;

// A transaction as the API returns it for one of its own vectors: amounts as numbers, the nonce, the signature.
function stored(name: string, patch: Partial<Transaction> = {}): Transaction {
  const { fields, signature } = vector(name);
  return {
    id: 't',
    sender_address: fields.sender_address,
    receiver_address: fields.receiver_address,
    amount: Number(fields.amount),
    fee: Number(fields.fee),
    nonce: fields.nonce,
    payload: 'payload' in fields ? fields.payload : null,
    signature,
    status: 'CONFIRMED',
    timestamp: '2026-10-21T15:00:00Z',
    tx_hash: 'h',
    block_number: 3,
    block_hash: '0000ab',
    ...patch,
  };
}

describe('signedFieldsOf and checkSignature', () => {
  it.each(['transfer', 'transfer_with_fee', 'smallest_amount', 'notarization'])(
    '%s: rebuilds exactly the fields that were signed, and the signature checks',
    (name) => {
      expect(signedFieldsOf(stored(name))).toEqual(vector(name).fields);
      expect(checkSignature(stored(name))).toBe('valid');
    },
  );

  it('notices a stored amount that is not what was signed', () => {
    expect(checkSignature(stored('transfer', { amount: 11 }))).toBe('invalid');
  });

  it('does not check a mining reward, which has no signature', () => {
    expect(checkSignature(stored('transfer', { sender_address: 'SYSTEM', signature: 'COINBASE' }))).toBe('reward');
  });

  it('cannot check a row from before nonces existed', () => {
    expect(checkSignature(stored('transfer', { nonce: null }))).toBe('no-nonce');
  });

  it('cannot check an amount a float cannot spell back with 8 decimals, and does not call it invalid', () => {
    // The API's JSON turns 9999999999.99999999 into 10000000000, whose 11 integer digits no signed message has.
    expect(checkSignature(stored('transfer', { amount: Number('9999999999.99999999') }))).toBe('cannot-rebuild');
  });
});

describe('journeyOf', () => {
  it('stops at Accepted while the transaction waits', () => {
    expect(journeyOf(stored('transfer', { status: 'PENDING', block_number: null }), 9)).toEqual({ reached: 2, above: null });
  });

  it('reaches Sealed in the top block, and Buried once a block rests on it', () => {
    expect(journeyOf(stored('transfer'), 3)).toEqual({ reached: 3, above: 0 });
    expect(journeyOf(stored('transfer'), 5)).toEqual({ reached: 4, above: 2 });
  });

  it('says how many blocks are on top', () => {
    expect([0, 1, 2].map(en.transaction.linkBack)).toEqual(['nothing links back to it yet', '1 block links back to it', '2 blocks link back to it']);
    expect([0, 1, 2].map(es.transaction.linkBack)).toEqual(['aún nada lo enlaza', '1 bloque lo enlaza', '2 bloques lo enlazan']);
  });
});

describe('fingerprintGroups', () => {
  it('splits a SHA-256 into 8 groups of 8', () => {
    const hash = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

    expect(fingerprintGroups(hash)).toEqual(['ba7816bf', '8f01cfea', '414140de', '5dae2223', 'b00361a3', '96177a9c', 'b410ff61', 'f20015ad']);
  });
});

describe('transactionTitle', () => {
  it('names a transfer by its amount and parties', () => {
    expect(transactionTitle(stored('transfer'))).toBe('10.00 VL from d75a…511a to 3d40…660c');
  });

  it('names a notarization by its author, or as waiting', () => {
    expect(transactionTitle(stored('notarization'))).toBe('A document notarized by fc51…8025');
    expect(transactionTitle(stored('notarization'), es.transaction.titles)).toBe('Un documento notarizado por fc51…8025');
    expect(transactionTitle(stored('notarization', { status: 'PENDING' }))).toBe('A document waiting to be sealed');
  });

  it('names a mining reward', () => {
    expect(transactionTitle(stored('transfer', { sender_address: 'SYSTEM', amount: 50.1 }))).toBe(
      'A mining reward of 50.10 VL to 3d40…660c',
    );
  });
});
