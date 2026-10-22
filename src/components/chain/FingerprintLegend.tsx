import { PALETTE } from '../../lib/fingerprint';
import { useT } from '../useT';

// "How to read a fingerprint", on ink in both themes: the selected block's first four bytes, their colours and the
// colours' names in the page's language (DESIGN.md › Fingerprints).
export function FingerprintLegend({ hex }: { hex: string }) {
  const words = useT().chain.legend;
  const bytes = [0, 1, 2, 3].map((index) => hex.slice(index * 2, index * 2 + 2)).filter((byte) => /^[0-9a-f]{2}$/.test(byte));
  return (
    <section aria-labelledby="how-h" className="rounded-3xl bg-vl-ink p-[22px] text-vl-on-ink">
      <h2 id="how-h" className="text-xl font-bold tracking-[-0.02em]">
        {words.title}
      </h2>
      <p className="mt-2 mb-3.5 text-[15px] text-vl-on-ink-muted">{words.text}</p>
      <ul className="flex flex-col gap-2 font-vl-mono text-[13px]">
        {bytes.map((byte, index) => {
          const color = parseInt(byte, 16) % 8;
          return (
            <li key={`${index}-${byte}`} className="flex items-center gap-3">
              <span className="w-11 text-vl-on-ink-muted">0x{byte}</span>
              <span aria-hidden="true" className="h-5 w-10 rounded shadow-[inset_0_0_0_1px_var(--color-vl-ink-line)]" style={{ background: PALETTE[color] }} />
              <span className="text-vl-on-ink-muted">{words.names[color]}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
