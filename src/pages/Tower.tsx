import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { BlockDetail } from '../components/tower/BlockDetail';
import { BlockList, type OlderState } from '../components/tower/BlockList';
import { Freshness } from '../components/tower/Freshness';
import { MineCard } from '../components/tower/MineCard';
import { TowerDrawing } from '../components/tower/TowerDrawing';
import { WaitingList } from '../components/tower/WaitingList';
import { mergeBlocks } from '../lib/chain';
import { formatAmount, formatClock, formatCount } from '../lib/format';
import { detailOf } from '../services/api';
import { getBlock, getBlocks, getPendingTransactions, mineBlock } from '../services/ledger';
import { useAppStore } from '../store/useAppStore';
import { useHealthStore } from '../store/useHealthStore';
import { useToastStore } from '../store/useToastStore';
import type { Block, Transaction } from '../types/ledger';

const TOWER_SIZE = 10;
const WAITING_SHOWN = 10;
const POLL_MS = 10_000;

interface Chain {
  // Every block loaded so far, newest first: the newest page and the older pages asked for.
  blocks: Block[];
  waiting: Transaction[];
  waitingTotal: number;
  updatedAt: number;
}

const blockNumber = (value: string | null) => (value !== null && /^\d+$/.test(value) ? Number(value) : null);

function olderText(tower: Block[], lowest: number | undefined): string {
  const bottom = tower[tower.length - 1]?.block_number ?? 0;
  if (bottom === 0) return '';
  if (lowest === 0) return 'all blocks loaded';
  return bottom === 1 ? '+ 1 older block below (#0)' : `+ ${bottom} older blocks below (#0 to #${bottom - 1})`;
}

export function Tower() {
  const [chain, setChain] = useState<Chain | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [arrivals, setArrivals] = useState(0);
  const [fresh, setFresh] = useState<ReadonlySet<number>>(new Set());
  const [linked, setLinked] = useState<Block | null>(null);
  const [peek, setPeek] = useState<number | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [mining, setMining] = useState(false);
  const [params, setParams] = useSearchParams();
  const online = useHealthStore((state) => state.online);
  const role = useAppStore((state) => state.user?.role ?? null);
  const show = useToastStore((state) => state.show);
  // The latest chain for callbacks that run between renders, such as the poll that compares tops.
  const chainRef = useRef<Chain | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  // Bumped when this page adds a block itself, so that a poll sent before it cannot take the block away again.
  const generation = useRef(0);

  const refresh = useCallback(async (force = false) => {
    if (inFlight.current && !force) return;
    inFlight.current = true;
    const sent = generation.current;
    try {
      const [page, waiting] = await Promise.all([getBlocks(0, TOWER_SIZE), getPendingTransactions(0, WAITING_SHOWN)]);
      if (!mounted.current || generation.current !== sent) return;
      const previous = chainRef.current;
      const next = {
        blocks: mergeBlocks(previous?.blocks ?? [], page.items, true),
        waiting: waiting.items,
        waitingTotal: waiting.total,
        updatedAt: Date.now(),
      };
      chainRef.current = next;
      setChain(next);
      setFailure(null);
      // The first answer only fills the tower; later ones announce the blocks that joined since.
      const before = previous?.blocks[0]?.block_number ?? -1;
      const top = page.items[0]?.block_number ?? -1;
      if (previous && top > before) {
        const joined = Array.from({ length: top - before }, (_, index) => before + 1 + index);
        setFresh((current) => new Set([...current, ...joined]));
        setArrivals((count) => count + 1);
        show(joined.length === 1 ? `Block #${top} joined the chain.` : `Blocks #${before + 1} to #${top} joined the chain.`);
      }
    } catch (error) {
      if (mounted.current) setFailure(detailOf(error, 'The API did not answer'));
    } finally {
      inFlight.current = false;
    }
  }, [show]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [refresh]);

  const blocks = chain?.blocks ?? [];
  const top = blocks[0]?.block_number ?? null;
  // Without ?block=n the selection follows the top of the chain; a picked or linked block stays put.
  const pinned = blockNumber(params.get('block'));
  const selectedNumber = pinned !== null && top !== null && pinned <= top ? pinned : top;
  const loaded = blocks.find((block) => block.block_number === selectedNumber);
  const selected = loaded ?? (linked?.block_number === selectedNumber ? linked : undefined);
  const needsLink = selectedNumber !== null && top !== null && selected === undefined;

  // A deep link below the loaded pages reads that one block.
  useEffect(() => {
    if (!needsLink || selectedNumber === null || top === null) return;
    let active = true;
    getBlocks(top - selectedNumber, 1).then(
      (page) => active && setLinked(page.items[0] ?? null),
      (error: unknown) => active && show(detailOf(error, `Could not load block #${selectedNumber}`), 'err'),
    );
    return () => {
      active = false;
    };
  }, [needsLink, selectedNumber, top, show]);

  const pick = (number: number) => setParams({ block: String(number) }, { replace: true });

  const loadOlder = async () => {
    const current = chainRef.current;
    const lowest = current?.blocks[current.blocks.length - 1]?.block_number;
    if (!current || lowest === undefined) return;
    setLoadingOlder(true);
    try {
      const page = await getBlocks(current.blocks[0].block_number - lowest + 1, TOWER_SIZE);
      const latest = chainRef.current ?? current;
      const next = { ...latest, blocks: mergeBlocks(latest.blocks, page.items, false) };
      chainRef.current = next;
      setChain(next);
    } catch (error) {
      show(detailOf(error, 'Could not load older blocks'), 'err');
    } finally {
      setLoadingOlder(false);
    }
  };

  const mine = async (minerAddress: string) => {
    setMining(true);
    try {
      const block = await mineBlock(minerAddress);
      generation.current += 1;
      const current = chainRef.current;
      if (current && mounted.current) {
        const next = { ...current, blocks: mergeBlocks(current.blocks, [block], true) };
        chainRef.current = next;
        setChain(next);
        setFresh((known) => new Set([...known, block.block_number]));
        setArrivals((count) => count + 1);
        // Back to following the top, where the new block now is.
        setParams({}, { replace: true });
      }
      // The response has no reward; the block's own coinbase transaction does.
      const reward = await getBlock(block.block_hash).then(
        (full) => full.transactions.find((transaction) => transaction.sender_address === 'SYSTEM')?.amount,
        () => undefined,
      );
      const rewardText = reward === undefined ? '' : ` · reward ${formatAmount(reward)} VL`;
      show(`Block #${block.block_number} sealed · nonce ${formatCount(block.nonce)}${rewardText}`);
      void refresh(true);
    } catch (error) {
      show(detailOf(error, 'The block could not be mined'), 'err');
    } finally {
      if (mounted.current) setMining(false);
    }
  };

  const loading = chain === null;
  const nextNumber = chain === null ? null : (top ?? -1) + 1;
  const tower = blocks.slice(0, TOWER_SIZE);
  const lowest = blocks[blocks.length - 1]?.block_number;
  const older: OlderState = lowest === 0 ? 'all' : loadingOlder ? 'loading' : 'more';
  const stats = [
    { label: 'Height', value: top ?? '—', pops: true },
    { label: 'Waiting', value: chain?.waitingTotal ?? '—', pops: true },
    { label: 'Last block', value: blocks[0] ? formatClock(blocks[0].timestamp) : '—', pops: false },
  ];

  return (
    <>
      <section className="mb-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-[-0.02em]">Block tower</h1>
          <Freshness updatedAt={chain?.updatedAt ?? null} retrying={failure !== null} />
        </div>
        <dl className="flex gap-7">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-[13px] text-vl-muted">{stat.label}</dt>
              <dd className="font-vl-mono text-[28px] font-medium">
                {/* A new key replays the pop when a block arrives, and only then. */}
                <span
                  key={stat.pops ? arrivals : undefined}
                  className={`inline-block ${stat.pops && arrivals > 0 ? 'animate-vl-pop' : ''}`}
                >
                  {stat.value}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* When /health fails the shell's banner already says so; this card is for errors it does not explain. */}
      {failure !== null && online === true && (
        <div
          role="alert"
          className="mb-5 flex animate-vl-fade-up flex-wrap items-center justify-between gap-3 rounded-[14px] border border-vl-danger bg-vl-surface px-[18px] py-4"
        >
          <span className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0 fill-none stroke-vl-danger" strokeWidth="1.5">
              <path d="M9 2l7.5 13h-15z" />
              <path d="M9 7v3.5M9 12.5v.5" />
            </svg>
            <span>
              Can’t load the blocks: {failure.replace(/\.$/, '')}.{' '}
              {chain ? 'Showing the last blocks we had; retrying every 10 s.' : 'Retrying every 10 s.'}
            </span>
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="h-10 rounded-[10px] border border-vl-line px-3.5 text-sm font-semibold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
          >
            Retry now
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-label="Tower"
          className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 rounded-2xl border border-vl-line bg-vl-surface p-4"
        >
          <TowerDrawing
            blocks={tower}
            loading={loading}
            focus={peek ?? selectedNumber}
            fresh={fresh}
            ghost={
              mining && nextNumber !== null
                ? { number: nextNumber, floating: true }
                : chain && blocks.length === 0
                  ? { number: 0, floating: false }
                  : null
            }
            olderText={olderText(tower, lowest)}
          />
          <MineCard
            next={nextNumber}
            waiting={chain?.waitingTotal ?? null}
            role={role}
            offline={online === false}
            mining={mining}
            onMine={(minerAddress) => void mine(minerAddress)}
          />
        </section>

        <section aria-labelledby="list-h" className="flex min-w-0 flex-[1_1_280px] flex-col gap-5">
          <BlockList
            blocks={blocks}
            loading={loading}
            selected={selectedNumber}
            fresh={fresh}
            older={older}
            onPick={pick}
            onPeek={setPeek}
            onLoadOlder={() => void loadOlder()}
          />
          <WaitingList waiting={chain?.waiting ?? null} total={chain?.waitingTotal ?? null} dimmed={mining} />
        </section>

        <section
          aria-label="Selected block"
          aria-live="polite"
          className="min-w-0 flex-[1_1_380px] rounded-2xl border border-vl-line bg-vl-surface p-[22px]"
        >
          {selected && top !== null ? (
            <BlockDetail key={selected.block_hash} block={selected} top={top} />
          ) : (
            <p className="text-vl-muted">{loading || needsLink ? 'Loading…' : 'Choose a block to see what is inside.'}</p>
          )}
        </section>
      </div>
    </>
  );
}
