import { fingerprint } from '../lib/fingerprint';

// An address's first four bytes as a 2×2 tile, beside its address in lists (DESIGN.md › Fingerprints). Decoration only.
export function Avatar({ hex, size = 36 }: { hex: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 grid-cols-2 gap-[2px] rounded-[10px] bg-vl-bg"
      style={{ width: size, height: size, padding: size >= 36 ? 4 : 3 }}
    >
      {fingerprint(hex.toLowerCase(), 4).map((color, index) => (
        <span
          key={index}
          className={`rounded-[3px] ${color ? 'shadow-[inset_0_0_0_1px_var(--color-vl-fp-ring)]' : 'bg-vl-skeleton'}`}
          style={color ? { background: color } : undefined}
        />
      ))}
    </span>
  );
}
