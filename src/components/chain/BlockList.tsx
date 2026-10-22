import { splitProofOfWork, formatClock } from '../../lib/format';
import type { Block } from '../../types/ledger';
import { Fingerprint } from '../Fingerprint';
import { useT } from '../useT';

export type OlderState = 'more' | 'loading' | 'all';

interface Props {
  blocks: Block[];
  loading: boolean;
  selected: number | null;
  fresh: ReadonlySet<number>;
  older: OlderState;
  onPick: (number: number) => void;
  onPeek: (number: number | null) => void;
  onLoadOlder: () => void;
}

export function BlockList({ blocks, loading, selected, fresh, older, onPick, onPeek, onLoadOlder }: Props) {
  const t = useT();
  const words = t.chain.list;
  const olderLabel: Record<OlderState, string> = { more: words.more, loading: words.loading, all: words.all };
  return (
    <section aria-labelledby="list-h" className="rounded-3xl bg-vl-surface px-6 py-5 max-sm:px-4">
      <h2 id="list-h" className="mb-2 text-xl font-bold tracking-[-0.02em]">
        {words.title}
      </h2>
      {loading && (
        <div aria-hidden="true" className="flex flex-col gap-1.5">
          {[0, 1].map((row) => (
            <span key={row} className="h-12 animate-vl-pulse rounded-xl bg-vl-skeleton" />
          ))}
        </div>
      )}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-1.5">
        {blocks.map((block) => {
          const number = block.block_number;
          const isSelected = number === selected;
          return (
            <li key={number} className={fresh.has(number) ? 'animate-vl-fade-up' : undefined}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onPick(number)}
                onMouseEnter={() => onPeek(number)}
                onMouseLeave={() => onPeek(null)}
                onFocus={() => onPeek(number)}
                onBlur={() => onPeek(null)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[15px] font-bold transition-colors duration-(--vl-dur-fast) ${
                  isSelected ? 'bg-vl-strong text-vl-on-strong' : 'bg-vl-raised text-vl-text'
                }`}
              >
                <Fingerprint hex={splitProofOfWork(block.block_hash)[1]} bars={8} className="h-3.5 w-12 flex-none gap-[2px]" radius={2} />
                {/* The spaces between spans keep the accessible name readable: "Block #2 1 tx", not "Block #21 tx". */}
                <span className="flex-auto">{words.block(number)}</span>{' '}
                <span className={`font-vl-mono text-xs font-normal ${isSelected ? 'text-vl-on-strong-muted' : 'text-vl-muted'}`}>
                  {words.txs(block.transaction_ids.length)} · {formatClock(block.timestamp)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {blocks.length > 0 && (
        <button
          type="button"
          onClick={onLoadOlder}
          disabled={older !== 'more'}
          className="mt-2.5 h-[46px] w-full rounded-[14px] border-[1.5px] border-dashed border-vl-line text-[15px] font-bold text-vl-text transition-colors duration-(--vl-dur-fast) enabled:hover:bg-vl-raised disabled:text-vl-muted"
        >
          {olderLabel[older]}
        </button>
      )}
    </section>
  );
}
