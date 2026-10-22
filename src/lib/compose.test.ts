import { describe, expect, it } from 'vitest';
import vectors from './__fixtures__/signing-vectors.json';
import { checkDraft, messageLines, type Draft } from './compose';
import { sha256Hex } from './digest';
import { buildSignedMessage } from './signing';

const transferVector = vectors.vectors.find((vector) => vector.name === 'transfer')!;
const notarizationVector = vectors.vectors.find((vector) => vector.name === 'notarization')!;
const sender = transferVector.public_key;
const transfer: Draft = { kind: 'transfer', to: transferVector.fields.receiver_address, amount: '10', fee: '0', payload: null };

const joined = (lines: [string, string][]) => `{${lines.map(([key, json]) => `${JSON.stringify(key)}:${json}`).join(',')}}`;

describe('checkDraft', () => {
  it("builds the API's transfer vector from what a person types", () => {
    const { fields } = checkDraft(transfer, sender, 1, 50);

    expect(fields).toEqual(transferVector.fields);
    expect(buildSignedMessage(fields!)).toBe(transferVector.message);
  });

  it("builds the API's notarization vector: nothing to the sender's own address, with the hash as payload", () => {
    const { fields: expected } = notarizationVector;
    const draft: Draft = { kind: 'notarize', to: '', amount: '', fee: '0', payload: expected.payload! };

    expect(checkDraft(draft, notarizationVector.public_key, expected.nonce, null).fields).toEqual(expected);
  });

  it.each<[string, Partial<Draft>, 'toOk' | 'amountOk' | 'feeOk']>([
    ['an address that is not 64 hex characters', { to: 'abc' }, 'toOk'],
    ['an amount of zero', { amount: '0' }, 'amountOk'],
    ['an amount with 9 decimals', { amount: '1.123456789' }, 'amountOk'],
    ['more than the balance holds', { amount: '49.95', fee: '0.1' }, 'amountOk'],
    ['a negative fee', { fee: '-1' }, 'feeOk'],
  ])('refuses %s', (_case, patch, flag) => {
    const checked = checkDraft({ ...transfer, ...patch }, sender, 1, 50);

    expect(checked[flag]).toBe(false);
    expect(checked.fields).toBeNull();
  });

  it('waits for the nonce, and for the document of a notarization', () => {
    expect(checkDraft(transfer, sender, null, 50).fields).toBeNull();
    expect(checkDraft({ ...transfer, kind: 'notarize' }, sender, 1, 50).fields).toBeNull();
  });

  it('accepts any amount while the balance is unknown: the API has the last word', () => {
    expect(checkDraft({ ...transfer, amount: '1000' }, sender, 1, null).amountOk).toBe(true);
  });

  it('tells an amount the balance does not cover from one that is wrong in itself', () => {
    expect(checkDraft({ ...transfer, amount: '49.95', fee: '0.1' }, sender, 1, 50).covered).toBe(false);
    expect(checkDraft({ ...transfer, amount: '0' }, sender, 1, 50).covered).toBe(true);
  });
});

describe('messageLines', () => {
  it('reads exactly as the signed message once the draft is complete', () => {
    expect(joined(messageLines(transfer, sender, 1))).toBe(transferVector.message);
  });

  it('marks what is still missing', () => {
    const lines = Object.fromEntries(messageLines({ ...transfer, to: '', amount: 'x', kind: 'notarize' }, sender, null));

    expect(lines).toMatchObject({ amount: '"0.00000000"', nonce: '…', payload: '"…"', receiver_address: JSON.stringify(sender) });
    expect(Object.fromEntries(messageLines({ ...transfer, to: '', amount: 'x' }, sender, null))).toMatchObject({
      amount: '"?"',
      receiver_address: '"…"',
    });
  });
});

describe('sha256Hex', () => {
  it('hashes bytes as the standard says', async () => {
    await expect(sha256Hex(new TextEncoder().encode('abc'))).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
