import { formatClock } from '../../lib/format';
import type { Block } from '../../types/ledger';

export type OlderState = 'more' | 'loading' | 'all';

const OLDER_LABEL: Record<OlderState, string> = {
  more: 'Load older blocks',
  loading: 'Loading older blocks…',
  all: 'All blocks loaded',
};

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
  return (
    <div>
      <h2 id="list-h" className="mb-2.5 text-[13px] font-medium text-vl-muted">
        Blocks · newest first
      </h2>
      {loading && (
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map((row) => (
            <span key={row} className="h-12 animate-vl-pulse rounded-[10px] bg-vl-surface" />
          ))}
        </div>
      )}
      {!loading && blocks.length === 0 && (
        <p className="animate-vl-fade-in rounded-xl border border-dashed border-vl-line p-4 text-vl-muted">
          No blocks yet. The first block mined becomes the genesis block, number 0.
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {blocks.map((block) => {
          const number = block.block_number;
          const count = block.transaction_ids.length;
          return (
            <li key={number} className={fresh.has(number) ? 'animate-vl-fade-up' : undefined}>
              <button
                type="button"
                aria-pressed={number === selected}
                onClick={() => onPick(number)}
                onMouseEnter={() => onPeek(number)}
                onMouseLeave={() => onPeek(null)}
                onFocus={() => onPeek(number)}
                onBlur={() => onPeek(null)}
                className={`flex w-full items-center justify-between gap-3 rounded-[10px] border px-3.5 py-3 text-left font-medium transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised ${
                  number === selected ? 'border-vl-accent bg-vl-raised' : 'border-vl-line'
                }`}
              >
                {/* The spaces between spans keep the accessible name readable: "Block #2 1 tx", not "Block #21 tx". */}
                <span>Block #{number}</span>{' '}
                <span className="font-vl-mono text-[11px] text-vl-muted">
                  {count} {count === 1 ? 'tx' : 'txs'} · {formatClock(block.timestamp)}
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
          className="mt-2 h-10 w-full rounded-[10px] border border-dashed border-vl-line text-sm font-medium text-vl-muted"
        >
          {OLDER_LABEL[older]}
        </button>
      )}
    </div>
  );
}
