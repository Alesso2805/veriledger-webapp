import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatCertified,
  formatClock,
  formatCount,
  formatSealed,
  formatTimeLeft,
  healthWord,
  shortHash,
  splitProofOfWork,
  transactionKind,
  transactionRoute,
} from './format';

const alice = '4655ec4f0e5d4b18c3a2e7c2195ab0d46f81c3a2f03b7c51e7c2195ab0d4a19d';
const bob = '9b1e77c0a51b8f03d6e27d40c2e9a51b8f03d6e2b0d1e67c7d13f2a95c083f42';

describe('amounts and counts', () => {
  it.each([
    [50, '50.00'],
    [50.3, '50.30'],
    [0, '0.00'],
    [0.00000001, '0.00000001'],
    [1234.5, '1,234.50'],
  ])('writes the amount %d as %j', (amount, expected) => {
    expect(formatAmount(amount)).toBe(expected);
  });

  it('groups thousands in counts such as a nonce', () => {
    expect(formatCount(277786)).toBe('277,786');
    expect(formatCount(7)).toBe('7');
  });
});

describe('hashes', () => {
  it('keeps the first 8 and last 4 characters of a long value', () => {
    expect(shortHash(alice)).toBe('4655ec4f…a19d');
  });

  it('keeps a longer tail, or a shorter head, when asked', () => {
    expect(shortHash(alice, 8)).toBe('4655ec4f…b0d4a19d');
    expect(shortHash(alice, 4, 4)).toBe('4655…a19d');
  });

  it('leaves a short value whole, such as the reward sender', () => {
    expect(shortHash('SYSTEM')).toBe('SYSTEM');
  });

  it('splits off the leading zeros of the proof of work', () => {
    expect(splitProofOfWork('0000a3f1')).toEqual(['0000', 'a3f1']);
    expect(splitProofOfWork('a3f1')).toEqual(['', 'a3f1']);
    expect(splitProofOfWork('0000')).toEqual(['0000', '']);
  });
});

describe('transactions', () => {
  const transfer = { sender_address: alice, receiver_address: bob, amount: 10, payload: null };
  const reward = { sender_address: 'SYSTEM', receiver_address: bob, amount: 50.3, payload: null };
  const notarization = { sender_address: alice, receiver_address: alice, amount: 0, payload: bob };

  it('names each kind', () => {
    expect(transactionKind(transfer)).toBe('Transfer');
    expect(transactionKind(reward)).toBe('Mining reward');
    expect(transactionKind(notarization)).toBe('Notarization');
  });

  it('calls a zero transfer without a payload a transfer', () => {
    expect(transactionKind({ ...transfer, amount: 0 })).toBe('Transfer');
  });

  it('says where the value went, or which document was notarized', () => {
    expect(transactionRoute(transfer)).toBe('4655ec4f…a19d → 9b1e77c0…3f42');
    expect(transactionRoute(reward)).toBe('SYSTEM → 9b1e77c0…3f42');
    expect(transactionRoute(notarization)).toBe('document 9b1e77c0…3f42');
  });
});

describe('times', () => {
  const sealed = '2026-10-20T21:34:47.512+00:00';

  it('writes a seal as date and time in the given zone', () => {
    expect(formatSealed(sealed, 'UTC')).toBe('20 Oct 2026 · 21:34:47');
    expect(formatSealed(sealed, 'America/Lima')).toBe('20 Oct 2026 · 16:34:47');
  });

  it('writes the moment a certificate states, in UTC whatever the reader’s zone', () => {
    expect(formatCertified(sealed)).toBe('20 October 2026 at 21:34:47 UTC');
  });

  it('writes the clock time for lists', () => {
    expect(formatClock(sealed, 'UTC')).toBe('21:34');
    expect(formatClock('2026-10-21T00:05:00Z', 'America/Lima')).toBe('19:05');
  });

  it('says how the API is, and never "offline" when only its database is down', () => {
    expect(healthWord(null, false)).toBe('checking');
    expect(healthWord(true, false)).toBe('online');
    expect(healthWord(false, false)).toBe('offline');
    expect(healthWord(false, true)).toBe('no database');
  });

  it('writes what is left of a demo in whole hours, then minutes in its last hour', () => {
    const hour = 3_600_000;
    expect(formatTimeLeft(24 * hour - 5_000)).toBe('23 h left');
    expect(formatTimeLeft(hour)).toBe('1 h left');
    expect(formatTimeLeft(hour - 1)).toBe('60 min left');
    expect(formatTimeLeft(45 * 60_000)).toBe('45 min left');
    // Never "0 min left" while the token is still good.
    expect(formatTimeLeft(10_000)).toBe('1 min left');
  });
});
