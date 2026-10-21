import { describe, expect, it } from 'vitest';
import vectors from './__fixtures__/signing-vectors.json';
import { KeyFileError, keyFileText, parseKeyFile } from './keyFile';

// RFC 8032 test keys from the API's vectors: published, test-only.
const { private_key: privateKey, public_key: publicKey } = vectors.vectors[0];
const other = vectors.vectors[1].public_key;

describe('keyFileText', () => {
  it('writes the pair so that parseKeyFile reads it back', () => {
    const pair = { public_key: publicKey, private_key: privateKey };

    expect(JSON.parse(keyFileText(pair))).toEqual(pair);
    expect(parseKeyFile(keyFileText(pair))).toEqual(pair);
  });
});

describe('parseKeyFile', () => {
  it('reads the pair the wallet saves', () => {
    expect(parseKeyFile(JSON.stringify({ public_key: publicKey, private_key: privateKey }))).toEqual({
      public_key: publicKey,
      private_key: privateKey,
    });
  });

  it('derives the public key when the file has only the private one, and accepts upper case', () => {
    expect(parseKeyFile(JSON.stringify({ private_key: privateKey.toUpperCase() }))).toEqual({
      public_key: publicKey,
      private_key: privateKey,
    });
  });

  it.each([
    ['text that is not JSON', 'not a key', 'not JSON'],
    ['JSON without a private key', '{"public_key": "ab"}', 'no private_key'],
    ['a private key that is not 64 hex characters', '{"private_key": "abc"}', 'no private_key'],
    ['halves that do not belong together', JSON.stringify({ public_key: other, private_key: privateKey }), 'does not belong'],
  ])('refuses %s', (_case, text, message) => {
    expect(() => parseKeyFile(text)).toThrow(KeyFileError);
    expect(() => parseKeyFile(text)).toThrow(message);
  });
});
