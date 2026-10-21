import { describe, expect, it } from 'vitest';
import vectors from './__fixtures__/signing-vectors.json';
import { keyPairFromSecret } from './keys';
import { AmountError, buildSignedMessage, signMessage, toAmount, verifySignature } from './signing';

// AR-06: the API's golden vectors, copied from veriledger-api docs/signing-vectors.json (47bec5c).
describe('AR-06 signing vectors', () => {
  it('uses the API version 2 file, with a nonce in every vector', () => {
    expect(vectors.version).toBe(2);
    expect(vectors.vectors.every((vector) => Number.isSafeInteger(vector.fields.nonce))).toBe(true);
    expect(vectors.vectors.length).toBeGreaterThanOrEqual(4);
  });

  it.each(vectors.vectors)('$name: the message is the same, byte for byte', (vector) => {
    expect(buildSignedMessage(vector.fields)).toBe(vector.message);
  });

  it.each(vectors.vectors)('$name: the signature is the same', (vector) => {
    expect(signMessage(vector.message, vector.private_key)).toBe(vector.signature);
  });

  it.each(vectors.vectors)('$name: the sender address is the key pair public half', (vector) => {
    expect(keyPairFromSecret(vector.private_key).public_key).toBe(vector.public_key);
  });

  it.each(vectors.vectors)('$name: the signature verifies against the sender address, and only against it', (vector) => {
    expect(verifySignature(vector.message, vector.signature, vector.public_key)).toBe(true);
    expect(verifySignature(vector.message.replace('"nonce":', '"nonce":9'), vector.signature, vector.public_key)).toBe(false);
    expect(verifySignature(vector.message, vector.signature, vector.fields.receiver_address === vector.public_key ? 'ab'.repeat(32) : vector.fields.receiver_address)).toBe(false);
  });

  it('treats malformed hex as not signed', () => {
    const [vector] = vectors.vectors;
    expect(verifySignature(vector.message, 'COINBASE', vector.public_key)).toBe(false);
  });
});

describe('toAmount', () => {
  it.each([
    ['10', '10.00000000'],
    ['0.5', '0.50000000'],
    ['007.25', '7.25000000'],
    ['0', '0.00000000'],
    ['5.', '5.00000000'],
    [' 3 ', '3.00000000'],
    ['1.12345678', '1.12345678'],
    ['9999999999.99999999', '9999999999.99999999'],
  ])('writes %j as %j', (input, expected) => {
    expect(toAmount(input)).toBe(expected);
  });

  it.each(['', 'abc', '-1', '1e3', '.5', '1,5', '1.123456789', '12345678901'])('refuses %j', (input) => {
    expect(() => toAmount(input)).toThrow(AmountError);
  });
});

describe('buildSignedMessage', () => {
  const fields = { sender_address: 'aa', receiver_address: 'bb', amount: '1.00000000', fee: '0.00000000', nonce: 7 };

  it('refuses an amount that is not in its canonical spelling', () => {
    expect(() => buildSignedMessage({ ...fields, amount: '1' })).toThrow(AmountError);
    expect(() => buildSignedMessage({ ...fields, fee: '0.1' })).toThrow(AmountError);
  });

  it.each([0, -1, 1.5, Number.NaN, 2 ** 53])('refuses the nonce %d', (nonce) => {
    expect(() => buildSignedMessage({ ...fields, nonce })).toThrow(RangeError);
  });

  it('writes the nonce as an integer, and places the payload between nonce and receiver_address', () => {
    expect(buildSignedMessage({ ...fields, payload: 'cafe' })).toBe(
      '{"amount":"1.00000000","fee":"0.00000000","nonce":7,"payload":"cafe","receiver_address":"bb","sender_address":"aa"}',
    );
    expect(buildSignedMessage(fields)).not.toContain('payload');
  });
});
