import { fingerprint } from '../lib/fingerprint';

interface Props {
  // Hex of a hash or an address; a byte not complete yet is a skeleton bar.
  hex: string;
  bars: number;
  className?: string;
  // Rounding of each bar, in px.
  radius?: number;
  // Bars grow in when the fingerprint first appears (DESIGN.md › Motion map); `stagger` spaces them in ms.
  grow?: boolean;
  stagger?: number;
  // On an ink panel the ring is ink's own line, so the ink bar still shows in the light theme.
  onInk?: boolean;
}

// Decoration next to the hash or address it draws, never instead of it (DESIGN.md › Fingerprints).
export function Fingerprint({ hex, bars, className = 'h-10 gap-[3px]', radius = 4, grow = false, stagger = 0, onInk = false }: Props) {
  const ring = onInk ? 'shadow-[inset_0_0_0_1px_var(--color-vl-ink-line)]' : 'shadow-[inset_0_0_0_1px_var(--color-vl-fp-ring)]';
  return (
    <span aria-hidden="true" className={`flex ${className}`}>
      {fingerprint(hex.toLowerCase(), bars).map((color, index) => (
        <span
          key={index}
          className={`flex-1 origin-bottom transition-colors duration-(--vl-dur-base) ${color ? ring : 'bg-vl-skeleton'} ${
            grow ? 'animate-vl-bars-in' : ''
          }`}
          style={{
            borderRadius: radius,
            ...(color ? { background: color } : {}),
            ...(grow && stagger ? { animationDelay: `${index * stagger}ms` } : {}),
          }}
        />
      ))}
    </span>
  );
}
