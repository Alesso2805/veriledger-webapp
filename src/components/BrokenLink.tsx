import { PALETTE } from '../lib/fingerprint';

// The failure cards' drawing (DESIGN.md › Failure): a tile of palette bars, then a broken connector and an empty tile
// in the danger colour.
// Nothing is missing this time, something broke.
const BARS = [PALETTE[0], PALETTE[2], PALETTE[3], PALETTE[7]];

export function BrokenLink({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex w-[180px] shrink-0 items-center gap-1.5 ${className}`}>
      <span className="flex h-11 flex-1 gap-[2px] rounded-xl bg-vl-bg p-2">
        {BARS.map((color) => (
          <span key={color} className="flex-1 rounded-[2px]" style={{ background: color }} />
        ))}
      </span>
      <svg width="22" height="14" viewBox="0 0 22 14" className="shrink-0">
        <path d="M2 7h18" strokeWidth="2.5" strokeDasharray="3 4" strokeLinecap="round" className="stroke-vl-danger" />
      </svg>
      <span className="h-11 flex-1 rounded-xl border-2 border-dashed border-vl-danger" />
    </span>
  );
}
