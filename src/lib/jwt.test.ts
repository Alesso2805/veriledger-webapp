import { describe, expect, it } from 'vitest';
import { expiresAt, isExpired } from './jwt';

const base64url = (value: object) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenWith = (payload: object) => `${base64url({ alg: 'HS256' })}.${base64url(payload)}.signature`;

const NOW = Date.UTC(2026, 9, 20, 12, 0, 0);

describe('jwt', () => {
  it('reads exp in milliseconds', () => {
    expect(expiresAt(tokenWith({ sub: 'a', exp: NOW / 1000 }))).toBe(NOW);
  });

  it('treats a token whose exp has passed as expired', () => {
    expect(isExpired(tokenWith({ exp: NOW / 1000 - 1 }), NOW)).toBe(true);
    expect(isExpired(tokenWith({ exp: NOW / 1000 }), NOW)).toBe(true);
  });

  it('keeps a token whose exp is still ahead', () => {
    expect(isExpired(tokenWith({ exp: NOW / 1000 + 60 }), NOW)).toBe(false);
  });

  it('keeps a token without a readable exp, for the API to judge', () => {
    expect(isExpired(tokenWith({ sub: 'a' }), NOW)).toBe(false);
    expect(isExpired('not-a-jwt', NOW)).toBe(false);
    expect(isExpired('abc.%%%.ghi', NOW)).toBe(false);
  });
});
