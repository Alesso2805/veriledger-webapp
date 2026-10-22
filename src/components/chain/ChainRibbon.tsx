import { afterProofOfWork } from '../../lib/fingerprint';
import { formatClock } from '../../lib/format';
import type { Block } from '../../types/ledger';
import { Fingerprint } from '../Fingerprint';
import { useT } from '../useT';

export interface NextTile {
  number: number;
  mining: boolean;
  // The elapsed time while mining, measured in the browser and written in the page's language.
  seconds: string;
}

interface Props {
  // The newest blocks, newest first.
  blocks: Block[];
  loading: boolean;
  selected: number | null;
  // The block pointed at or focused, else the selected one: its link lights up.
  focus: number | null;
  fresh: ReadonlySet<number>;
  next: NextTile | null;
  olderText: string;
  onPick: (number: number) => void;
  onPeek: (number: number | null) => void;
}

const RING = '0 0 0 2px var(--color-vl-accent)';
const NO_RING = '0 0 0 2px transparent';

function Connector({ lit, hidden = false }: { lit: boolean; hidden?: boolean }) {
  return (
    <svg width="32" height="16" viewBox="0 0 32 16" aria-hidden="true" className="shrink-0" style={{ opacity: hidden ? 0 : 1 }}>
      <path
        d="M2 8h28"
        strokeWidth="2.5"
        strokeDasharray={lit ? '0' : '2 5'}
        strokeLinecap="round"
        className={`transition-[stroke] duration-[260ms] ${lit ? 'stroke-vl-accent' : 'stroke-vl-faint'}`}
      />
    </svg>
  );
}

// Artboard "C · La cadena": the newest blocks from oldest to newest, each tile linked to the one before by the
// fingerprint of its previous_hash. The list is its own scroll box laid out from the right (row-reverse), so it opens
// at the newest block without a script; with focus, the arrow keys scroll it.
export function ChainRibbon({ blocks, loading, selected, focus, fresh, next, olderText, onPick, onPeek }: Props) {
  const t = useT();
  const words = t.chain.ribbon;
  const focusBlock = blocks.find((block) => block.block_number === focus);
  const linked = focusBlock ? blocks.find((block) => block.block_number === focusBlock.block_number + 1) : undefined;
  const caption = !focusBlock
    ? ''
    : linked
      ? words.caption(focusBlock.block_number, linked.block_number)
      : words.newest(focusBlock.block_number);
  const label = blocks.length
    ? words.label(blocks.length, blocks[blocks.length - 1].block_number, blocks[0].block_number)
    : words.noBlocks;

  return (
    <section aria-labelledby="ribbon-h">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="ribbon-h" className="text-[15px] font-medium text-vl-muted">
          {words.heading}
        </h2>
        <span className="font-vl-mono text-xs text-vl-muted">{olderText}</span>
      </div>
      {loading ? (
        <div role="status" aria-label={words.loading} className="flex gap-8 overflow-hidden px-1 pt-2 pb-3">
          {[0, 1, 2, 3, 4].map((index) => (
            <span key={index} className="h-44 w-[188px] flex-none animate-vl-pulse rounded-[18px] bg-vl-skeleton" />
          ))}
        </div>
      ) : (
        <ol aria-label={label} tabIndex={0} className="flex flex-row-reverse justify-start overflow-x-auto px-1 pt-2 pb-3">
          {next && (
            <li className="flex flex-none items-center">
              <Connector lit={false} hidden={blocks.length === 0} />
              <div
                aria-hidden="true"
                className={`flex w-[188px] flex-col justify-between gap-3 rounded-[18px] border-2 border-dashed p-4 ${
                  next.mining ? 'animate-vl-pulse border-vl-accent' : 'border-vl-faint'
                }`}
              >
                <span className="font-vl-mono text-xs text-vl-muted">
                  {next.mining ? words.mining(next.seconds) : next.number === 0 ? words.genesis : words.next}
                </span>
                <Fingerprint hex="" bars={8} className="h-10 gap-[3px]" />
                <span className="text-[32px] leading-none font-extrabold tracking-[-0.03em]">#{next.number}</span>
              </div>
            </li>
          )}
          {blocks.map((block, index) => {
            const number = block.block_number;
            const isFocus = focus === number;
            const linkLit = focus !== null && focus === number + 1;
            const isNew = fresh.has(number);
            const rest = afterProofOfWork(block.block_hash);
            const txs = t.chain.list.txs(block.transaction_ids.length);
            return (
              <li key={number} className={`flex flex-none items-center ${isNew ? 'animate-vl-tile-in' : ''}`}>
                <Connector lit={isFocus} hidden={index === blocks.length - 1} />
                {/* Named by its content, in reading order: "#11 07:11 0000ab12… · 2 txs, links to #10". The order classes
                    draw the link on top, as the canvas does. */}
                <button
                  type="button"
                  aria-pressed={selected === number}
                  onClick={() => onPick(number)}
                  onMouseEnter={() => onPeek(number)}
                  onMouseLeave={() => onPeek(null)}
                  onFocus={() => onPeek(number)}
                  onBlur={() => onPeek(null)}
                  className="flex w-[188px] flex-col gap-3 rounded-[18px] bg-vl-surface p-4 text-left text-vl-text transition-[transform,box-shadow] duration-[260ms] ease-vl-out"
                  style={{ boxShadow: selected === number ? RING : NO_RING, transform: isFocus ? 'translateY(-4px)' : 'none' }}
                >
                  <span className="order-3 flex items-baseline justify-between gap-2">
                    <span className="text-[32px] leading-none font-extrabold tracking-[-0.03em]">#{number}</span>{' '}
                    <span className="font-vl-mono text-xs text-vl-muted">{formatClock(block.timestamp)}</span>
                  </span>{' '}
                  <span className="order-4 font-vl-mono text-xs text-vl-muted">
                    {block.block_hash.slice(0, 10)}… · {txs}
                  </span>
                  <span className="order-1 flex items-center gap-2 font-vl-mono text-[11px] text-vl-muted">
                    <span className="sr-only">,</span> {words.linksTo}{' '}
                    <span className="sr-only">{number === 0 ? words.nothing : `#${number - 1}`}</span>
                    <span
                      className="flex-auto rounded p-[2px] transition-shadow duration-200"
                      style={{ boxShadow: isFocus ? RING : NO_RING }}
                    >
                      <Fingerprint hex={afterProofOfWork(block.previous_hash)} bars={8} className="h-2.5 gap-[2px]" radius={2} />
                    </span>
                  </span>
                  <span
                    className="order-2 -m-[3px] rounded-lg p-[3px] transition-shadow duration-200"
                    style={{ boxShadow: linkLit ? RING : NO_RING }}
                  >
                    <Fingerprint hex={rest} bars={8} className="h-10 gap-[3px]" grow={isNew} />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <div aria-live="polite" className="min-h-[52px]">
        {caption && (
          <p key={caption} className="inline-flex animate-vl-fade-up rounded-[14px] bg-vl-surface px-4 py-2.5 font-medium">
            {caption}
          </p>
        )}
        {!loading && blocks.length === 0 && (
          <p className="inline-flex animate-vl-fade-in rounded-[14px] border-[1.5px] border-dashed border-vl-faint px-4 py-2.5 text-vl-muted">
            {words.empty}
          </p>
        )}
      </div>
    </section>
  );
}
