import type { Messages } from '../../lib/i18n';
import { useT } from '../useT';

export type ResolvePhase = 'idle' | 'resolving' | 'replied';

export type ResolveResult =
  | { kind: 'kept' }
  | { kind: 'replaced'; before: number | null; after: number | null }
  | { kind: 'failed'; detail: string };

interface Props {
  admin: boolean;
  peerCount: number;
  phase: ResolvePhase;
  result: ResolveResult | null;
  onResolve: () => void;
}

function outcome(result: ResolveResult, words: Messages['network']['resolve']): { title: string; text: string } {
  switch (result.kind) {
    case 'kept':
      return { title: words.keptTitle, text: words.keptText };
    case 'replaced':
      return { title: words.replacedTitle, text: words.replacedText(String(result.before ?? '—'), String(result.after ?? '—')) };
    case 'failed':
      return { title: words.failedTitle, text: words.failedText(result.detail.replace(/\.$/, '')) };
  }
}

// Resolving asks every peer for its chain (VLA-19). While it runs, pulses travel to the peers on the map.
export function ResolveCard({ admin, peerCount, phase, result, onResolve }: Props) {
  const words = useT().network.resolve;
  const ready = admin && peerCount > 0 && phase !== 'resolving';
  const shown = result ? outcome(result, words) : null;
  const failed = result?.kind === 'failed';

  return (
    <section aria-labelledby="resolve-h" className="rounded-3xl bg-vl-surface p-6 max-sm:p-5">
      <h2 id="resolve-h" className="text-[22px] font-bold tracking-[-0.02em]">
        {words.title}
      </h2>
      <p className="mt-1.5 mb-3.5 text-[15px] text-vl-muted">{words.text}</p>
      <button
        type="button"
        onClick={onResolve}
        disabled={!ready}
        className={`h-[52px] rounded-[14px] px-[22px] font-bold transition-colors duration-(--vl-dur-base) ${
          ready ? 'bg-vl-accent text-vl-on-accent' : 'bg-vl-skeleton text-vl-muted'
        }`}
      >
        {phase === 'resolving' ? words.asking(peerCount) : words.button}
      </button>
      <div aria-live="polite">
        {shown && (
          <div
            className={`mt-3.5 rounded-2xl p-3.5 ${failed ? 'animate-vl-shake bg-vl-danger-soft' : 'animate-vl-fade-up bg-vl-ok-soft'}`}
          >
            <p className={`font-bold ${failed ? 'text-vl-danger' : 'text-vl-ok'}`}>{shown.title}</p>
            <p className="mt-1 text-[15px]">{shown.text}</p>
          </div>
        )}
      </div>
    </section>
  );
}
