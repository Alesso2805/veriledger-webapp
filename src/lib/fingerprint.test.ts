import { describe, expect, it } from 'vitest';
import { fingerprint, PALETTE } from './fingerprint';

describe('fingerprint', () => {
  it('gives each byte the palette colour of byte mod 8', () => {
    // 0x00 → 0, 0x09 → 1, 0xff → 7, 0xa3 → 3
    expect(fingerprint('0009ffa3', 4)).toEqual([PALETTE[0], PALETTE[1], PALETTE[7], PALETTE[3]]);
  });

  it('leaves a byte that is not complete, or not hex, empty', () => {
    expect(fingerprint('a3f', 3)).toEqual([PALETTE[3], null, null]);
    expect(fingerprint('zz', 1)).toEqual([null]);
  });
});
