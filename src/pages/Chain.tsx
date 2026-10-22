import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { BlockDetail } from '../components/chain/BlockDetail';
import { BlockList, type OlderState } from '../components/chain/BlockList';
import { ChainRibbon } from '../components/chain/ChainRibbon';
import { FingerprintLegend } from '../components/chain/FingerprintLegend';
import { Freshness } from '../components/chain/Freshness';
import { MineCard } from '../components/chain/MineCard';
import { WaitingList } from '../components/chain/WaitingList';
import { useStartDemo } from '../components/useStartDemo';
import { useLanguage, useT } from '../components/useT';
import { mergeBlocks } from '../lib/chain';
import { afterProofOfWork } from '../lib/fingerprint';
import { formatAmount, formatClock, formatCount, formatSeconds } from '../lib/format';
import type { Messages } from '../lib/i18n';
import { detailOf } from '../services/api';
import { getBlock, getBlocks, getPendingTransactions, mineBlock } from '../services/ledger';
import { useAppStore } from '../store/useAppStore';
import { useHealthStore } from '../store/useHealthStore';
import { useToastStore } from '../store/useToastStore';
import type { Block, Transaction } from '../types/ledger';

const RIBBON_SIZE = 10;
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

function olderText(ribbon: Block[], lowest: number | undefined, t: Messages): string {
  const bottom = ribbon[ribbon.length - 1]?.block_number ?? 0;
  if (bottom === 0) return '';
  if (lowest === 0) return t.chain.ribbon.olderAll;
  return bottom === 1 ? t.chain.ribbon.olderOne : t.chain.ribbon.olderMany(bottom);
}

// The API answers only when the block is sealed, so the time since the request left is the only progress to show.
function useElapsed(running: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(performance.now() - started), 100);
    return () => clearInterval(timer);
  }, [running]);
  return elapsed;
}

// Artboard "C · La cadena" (VLW-43): the ribbon of fingerprints, the selected block, the list, and beside them
// mining, what waits for the next block and how to read a fingerprint.
export function Chain() {
  const t = useT();
  const language = useLanguage();
  // The latest texts for callbacks that outlive a render, such as the poll's toast.
  const texts = useRef(t);
  useEffect(() => {
    texts.current = t;
  }, [t]);
  const [chain, setChain] = useState<Chain | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [arrivals, setArrivals] = useState(0);
  const [fresh, setFresh] = useState<ReadonlySet<number>>(new Set());
  const [linked, setLinked] = useState<Block | null>(null);
  const [peek, setPeek] = useState<number | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [mining, setMining] = useState(false);
  const elapsed = useElapsed(mining);
  const [params, setParams] = useSearchParams();
  const online = useHealthStore((state) => state.online);
  const databaseDown = useHealthStore((state) => state.databaseDown);
  const signedIn = useAppStore((state) => state.token !== null);
  const demoMode = useHealthStore((state) => state.demoMode);
  const role = useAppStore((state) => state.user?.role ?? null);
  const show = useToastStore((state) => state.show);
  const demo = useStartDemo((text) => show(text, 'err'));
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
      const [page, waiting] = await Promise.all([getBlocks(0, RIBBON_SIZE), getPendingTransactions(0, WAITING_SHOWN)]);
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
      // The first answer only fills the ribbon; later ones announce the blocks that joined since.
      const before = previous?.blocks[0]?.block_number ?? -1;
      const top = page.items[0]?.block_number ?? -1;
      if (previous && top > before) {
        const joined = Array.from({ length: top - before }, (_, index) => before + 1 + index);
        setFresh((current) => new Set([...current, ...joined]));
        setArrivals((count) => count + 1);
        show(joined.length === 1 ? texts.current.chain.joinedOne(top) : texts.current.chain.joinedMany(before + 1, top));
      }
    } catch (error) {
      if (mounted.current) setFailure(detailOf(error, texts.current.chain.noAnswer));
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
      (error: unknown) => active && show(detailOf(error, texts.current.chain.blockFailed(selectedNumber)), 'err'),
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
      const page = await getBlocks(current.blocks[0].block_number - lowest + 1, RIBBON_SIZE);
      const latest = chainRef.current ?? current;
      const next = { ...latest, blocks: mergeBlocks(latest.blocks, page.items, false) };
      chainRef.current = next;
      setChain(next);
    } catch (error) {
      show(detailOf(error, t.chain.olderFailed), 'err');
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
      const words = texts.current;
      const rewardText = reward === undefined ? '' : words.chain.reward(formatAmount(reward));
      show(`${words.chain.sealed(block.block_number, formatCount(block.nonce, language))}${rewardText}`);
      void refresh(true);
    } catch (error) {
      show(detailOf(error, texts.current.chain.mineFailed), 'err');
    } finally {
      if (mounted.current) setMining(false);
    }
  };

  const loading = chain === null;
  const nextNumber = chain === null ? null : (top ?? -1) + 1;
  const ribbon = blocks.slice(0, RIBBON_SIZE);
  const lowest = blocks[blocks.length - 1]?.block_number;
  const older: OlderState = lowest === 0 ? 'all' : loadingOlder ? 'loading' : 'more';
  const seconds = formatSeconds(elapsed, language);
  const stats = [
    { label: t.chain.stats.height, value: top ?? '—', pops: true },
    { label: t.chain.stats.waiting, value: chain?.waitingTotal ?? '—', pops: true },
    { label: t.chain.stats.last, value: blocks[0] ? formatClock(blocks[0].timestamp) : '—', pops: false },
  ];

  return (
    <>
      <section className="mb-[22px] flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-[56px] leading-none font-extrabold tracking-[-0.035em] max-sm:text-[40px]">{t.chain.title}</h1>
          <Freshness updatedAt={chain?.updatedAt ?? null} retrying={failure !== null} />
        </div>
        <dl className="grid min-w-[min(420px,100%)] grid-cols-3 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col justify-between rounded-[18px] bg-vl-surface px-4 py-3">
              <dt className="text-[13px] text-vl-muted">{stat.label}</dt>
              <dd className="text-[34px] leading-[1.15] font-extrabold tracking-[-0.03em] tabular-nums">
                {/* A new key replays the pop when a block arrives, and only then. */}
                <span key={stat.pops ? arrivals : undefined} className={`inline-block ${stat.pops && arrivals > 0 ? 'animate-vl-pop' : ''}`}>
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
          className="mb-5 flex animate-vl-fade-up flex-wrap items-center justify-between gap-3 rounded-[18px] bg-vl-danger-soft px-[18px] py-3.5"
        >
          <span className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0 fill-none stroke-vl-danger" strokeWidth="1.6">
              <path d="M9 2l7.5 13h-15z" />
              <path d="M9 7v3.5M9 12.5v.5" />
            </svg>
            <span>
              {t.chain.cantLoad(failure.replace(/\.$/, ''))} {chain ? t.chain.keptLast : t.chain.retrying}
            </span>
          </span>
          <button type="button" onClick={() => void refresh()} className="h-11 rounded-xl bg-vl-strong px-4 text-sm font-bold text-vl-on-strong">
            {t.shell.offline.retry}
          </button>
        </div>
      )}

      <ChainRibbon
        blocks={ribbon}
        loading={loading}
        selected={selectedNumber}
        focus={peek ?? selectedNumber}
        fresh={fresh}
        next={nextNumber === null ? null : { number: nextNumber, mining, seconds }}
        olderText={olderText(ribbon, lowest, t)}
        onPick={pick}
        onPeek={setPeek}
      />

      <div className="mt-3.5 flex flex-wrap items-start gap-[22px]">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[22px]">
          <section aria-label={t.chain.selected} aria-live="polite" className="rounded-3xl bg-vl-surface p-6 max-sm:p-5">
            {selected && top !== null ? (
              <BlockDetail key={selected.block_hash} block={selected} top={top} />
            ) : (
              <p className="text-vl-muted">{loading || needsLink ? t.chain.loading : t.chain.choose}</p>
            )}
          </section>
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
        </div>

        <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-[22px]">
          <MineCard
            next={nextNumber}
            waiting={chain?.waitingTotal ?? null}
            signedIn={signedIn}
            demoMode={demoMode}
            startingDemo={demo.starting}
            onTryDemo={() => void demo.start()}
            role={role}
            offline={online === false}
            databaseDown={databaseDown}
            mining={mining}
            seconds={seconds}
            onMine={(minerAddress) => void mine(minerAddress)}
          />
          <WaitingList waiting={chain?.waiting ?? null} total={chain?.waitingTotal ?? null} dimmed={mining} />
          <FingerprintLegend hex={afterProofOfWork(selected?.block_hash ?? '')} />
        </aside>
      </div>
    </>
  );
}
