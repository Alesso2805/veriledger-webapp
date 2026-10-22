import { useEffect, useState } from 'react';
import type { Journey } from '../../lib/transaction';
import { useT } from '../useT';

interface Props {
  journey: Journey;
  blockNumber: number | null;
  waiting: boolean;
  // A mining reward is created by the miner's node with its block, never signed by a person.
  reward: boolean;
}

export function JourneyBar({ journey, blockNumber, waiting, reward }: Props) {
  const words = useT().transaction.journey;
  const [filled, setFilled] = useState(false);

  // The bar fills once the page has drawn, the page's one width transition (DESIGN.md › Motion map).
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const { reached, above } = journey;
  const steps: [string, string][] = [
    reward ? [words.created, words.createdHint] : [words.signed, words.signedHint],
    [words.accepted, reward ? words.acceptedReward : words.acceptedHint],
    [words.sealed, blockNumber === null ? words.sealedWaiting : words.sealedIn(blockNumber)],
    [words.buried, above === null || above === 0 ? words.buriedNot : words.buriedAfter(above)],
  ];
  const width = reached <= 1 ? 0 : ((reached - 1) / 3) * 100;

  return (
    <section aria-label={words.label} className="mt-5 rounded-3xl bg-vl-surface px-[22px] pt-6 pb-5 max-sm:p-[18px]">
      <div className="relative px-1.5">
        <div aria-hidden="true" className="absolute top-3.5 right-[22px] left-[22px] h-1 rounded bg-vl-line-soft">
          <div
            className="h-full rounded bg-vl-accent transition-[width] duration-[900ms] ease-vl-out"
            style={{ width: filled ? `${width}%` : '0%' }}
          />
        </div>
        <ol className="relative grid grid-cols-4 gap-1.5">
          {steps.map(([label, hint], index) => {
            const done = index < reached;
            return (
              <li key={label} className="flex flex-col items-center gap-2 text-center">
                <span
                  aria-hidden="true"
                  className={`flex size-8 items-center justify-center rounded-full border-2 ${
                    done ? 'border-vl-text bg-vl-text' : 'border-vl-line bg-vl-surface'
                  } ${done && filled ? 'animate-vl-pop' : ''}`}
                >
                  {done && (
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <path d="M2.5 7.5l3 3L11.5 4" fill="none" strokeWidth="2.2" className="stroke-vl-surface" />
                    </svg>
                  )}
                </span>
                <span className={`text-[15px] font-bold ${done ? 'text-vl-text' : 'text-vl-muted'}`}>
                  {label}
                  <span className="sr-only">{done ? words.done : words.notYet}</span>
                </span>{' '}
                <span className="text-sm text-vl-muted max-sm:hidden">{hint}</span>
              </li>
            );
          })}
        </ol>
      </div>
      {waiting && (
        <p aria-live="polite" className="mt-4 animate-vl-pulse text-center text-[15px] text-vl-muted">
          {words.waiting}
        </p>
      )}
    </section>
  );
}
