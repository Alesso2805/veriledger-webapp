// The fingerprint of DESIGN.md › Fingerprints: one colour per byte of a hash or an address (byte mod 8).
// cobalt, tangerine, mint, lemon, ink, sky, coral, lilac
export const PALETTE = ['#2F45FF', '#FF7A1A', '#1FB58F', '#F5C400', '#101418', '#7AB8FF', '#FF5A6E', '#A88BFF'] as const;

// The palette's marks on ink panels: the same in both themes, because ink is dark in both (DESIGN.md › Tokens and motion).
export const ON_INK = { ok: PALETTE[2], refused: PALETTE[6], info: PALETTE[5] } as const;

// One colour per byte; a byte not yet complete is null, drawn as a skeleton bar.
export function fingerprint(hex: string, bars: number): (string | null)[] {
  return Array.from({ length: bars }, (_, i) => {
    const byte = hex.slice(i * 2, i * 2 + 2);
    return /^[0-9a-f]{2}$/.test(byte) ? PALETTE[parseInt(byte, 16) % 8] : null;
  });
}

// A block's fingerprint is drawn from the bytes after its leading zeros: the proof of work, at least MINING_DIFFICULTY
// of them and sometimes more (DESIGN.md › Fingerprints). The genesis block's previous_hash is all zeros, so it links
// to nothing.
export function afterProofOfWork(hash: string): string {
  return hash.replace(/^0+/, '');
}
