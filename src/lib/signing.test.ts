import { describe, expect, it } from 'vitest';
import vectors from './__fixtures__/signing-vectors.json';
import { keyPairFromSecret } from './keys';
import { AmountError, buildSignedMessage, signMessage, toAmount } from './signing';

// AR-06: the API's golden vectors, copied from veriledger-api docs/signing-vectors.json (7ce0465).
describe('AR-06 signing vectors', () => {
  it('uses the API version 1 file, with vectors to check', () => {
    expect(vectors.version).toBe(1);
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
  const fields = { sender_address: 'aa', receiver_address: 'bb', amount: '1.00000000', fee: '0.00000000' };

  it('refuses an amount that is not in its canonical spelling', () => {
    expect(() => buildSignedMessage({ ...fields, amount: '1' })).toThrow(AmountError);
    expect(() => buildSignedMessage({ ...fields, fee: '0.1' })).toThrow(AmountError);
  });

  it('places the payload between fee and receiver_address, and leaves it out when absent', () => {
    expect(buildSignedMessage({ ...fields, payload: 'cafe' })).toBe(
      '{"amount":"1.00000000","fee":"0.00000000","payload":"cafe","receiver_address":"bb","sender_address":"aa"}',
    );
    expect(buildSignedMessage(fields)).not.toContain('payload');
  });
});
