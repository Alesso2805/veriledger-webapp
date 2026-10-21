import { describe, expect, it } from 'vitest';
import { generateKeyPair, keyPairFromSecret } from './keys';

// RFC 8032, section 7.1, test 1.
const RFC8032_SECRET = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
const RFC8032_PUBLIC = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';

describe('keys', () => {
  it('derives the public key of RFC 8032 test 1', () => {
    expect(keyPairFromSecret(RFC8032_SECRET)).toEqual({ private_key: RFC8032_SECRET, public_key: RFC8032_PUBLIC });
  });

  it('accepts an uppercase secret and returns lowercase hex', () => {
    expect(keyPairFromSecret(RFC8032_SECRET.toUpperCase())).toEqual({
      private_key: RFC8032_SECRET,
      public_key: RFC8032_PUBLIC,
    });
  });

  it('generates raw 32-byte keys whose public half matches the secret', () => {
    const pair = generateKeyPair();

    expect(pair.private_key).toMatch(/^[0-9a-f]{64}$/);
    expect(pair.public_key).toMatch(/^[0-9a-f]{64}$/);
    expect(keyPairFromSecret(pair.private_key)).toEqual(pair);
  });

  it('generates a new secret each time', () => {
    expect(generateKeyPair().private_key).not.toBe(generateKeyPair().private_key);
  });
});
