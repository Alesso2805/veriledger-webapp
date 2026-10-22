import { PALETTE } from '../lib/fingerprint';

// The logo: four bars of the fingerprint palette (cobalt, tangerine, mint, ink) on a white tile, in both themes.
const BARS = [PALETTE[0], PALETTE[1], PALETTE[2], PALETTE[4]];

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 gap-[2px] rounded-[9px] bg-vl-logo-tile"
      style={{ width: size, height: size, padding: Math.round(size * 0.16) }}
    >
      {BARS.map((color) => (
        <span key={color} className="flex-1 rounded-[2px]" style={{ background: color }} />
      ))}
    </span>
  );
}
