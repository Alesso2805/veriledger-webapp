import { useEffect, useState } from 'react';
import { blocksOnTop, type Journey } from '../../lib/transaction';

interface Props {
  journey: Journey;
  blockNumber: number | null;
  waiting: boolean;
  // A mining reward is created by the miner's node with its block, never signed by a person.
  reward: boolean;
}

// Signed → Accepted → Sealed → Buried, from the status, the block number and the height.
export function JourneyBar({ journey, blockNumber, waiting, reward }: Props) {
  const [filled, setFilled] = useState(false);

  // The bar fills once the page has drawn, the page's one width transition (DESIGN.md › Motion map).
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const { reached, above } = journey;
  const steps: [string, string][] = [
    reward ? ['Created', 'by the node that mined it'] : ['Signed', 'by the sender, in their browser'],
    ['Accepted', reward ? 'with its block' : 'signature and balance checked'],
    ['Sealed', blockNumber === null ? 'waiting for a miner' : `in block #${blockNumber}`],
    ['Buried', above === null || above === 0 ? 'no blocks on top yet' : blocksOnTop(above)],
  ];
  const width = reached <= 1 ? 0 : ((reached - 1) / 3) * 100;

  return (
    <section aria-label="Journey" className="mt-6 rounded-2xl border border-vl-line bg-vl-surface px-[22px] pt-[22px] pb-5">
      <div className="relative px-2.5">
        <div aria-hidden="true" className="absolute top-[13px] right-[22px] left-[22px] h-1 rounded bg-vl-line">
          <div
            className="h-full rounded bg-vl-accent transition-[width] duration-[900ms] ease-vl-out"
            style={{ width: filled ? `${width}%` : '0%' }}
          />
        </div>
        <ol className="relative grid grid-cols-4 gap-2">
          {steps.map(([label, hint], index) => {
            const done = index < reached;
            return (
              <li key={label} className="flex flex-col items-center gap-2 text-center">
                <span
                  aria-hidden="true"
                  className={`flex size-[30px] items-center justify-center rounded-full border-2 ${
                    done ? 'border-vl-accent bg-vl-accent' : 'border-vl-line bg-vl-surface'
                  } ${done && filled ? 'animate-vl-pop' : ''}`}
                >
                  {done && (
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <path d="M3 7.5l2.6 2.5L11 4.5" fill="none" strokeWidth="2" className="stroke-vl-on-accent" />
                    </svg>
                  )}
                </span>
                <span className={`text-sm font-semibold ${done ? 'text-vl-text' : 'text-vl-muted'}`}>
                  {label}
                  <span className="sr-only">{done ? ', done' : ', not yet'}</span>
                </span>{' '}
                <span className="text-[13px] text-vl-muted">{hint}</span>
              </li>
            );
          })}
        </ol>
      </div>
      {waiting && (
        <p aria-live="polite" className="mt-4 animate-vl-pulse text-center text-sm text-vl-muted">
          Waiting for the next block. This page checks again every 10 s.
        </p>
      )}
    </section>
  );
}
