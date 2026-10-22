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
    <section aria-labelledby="resolve-h" className="rounded-2xl border border-vl-line bg-vl-surface p-5">
      <h2 id="resolve-h" className="text-[17px] font-bold">
        {words.title}
      </h2>
      <p className="mt-1.5 mb-3.5 text-sm text-vl-muted">
        {words.text}
      </p>
      <button
        type="button"
        onClick={onResolve}
        disabled={!ready}
        className={`h-11 rounded-[10px] px-4 font-semibold transition-colors duration-(--vl-dur-base) ${
          ready ? 'bg-vl-accent text-vl-on-accent' : 'bg-vl-line text-vl-muted'
        }`}
      >
        {phase === 'resolving' ? words.asking(peerCount) : words.button}
      </button>
      <div aria-live="polite">
        {shown && (
          <div
            className={`mt-3.5 rounded-[10px] border bg-vl-bg p-3 ${
              failed ? 'animate-vl-shake border-vl-danger' : 'animate-vl-fade-up border-vl-ok'
            }`}
          >
            <p className={`font-semibold ${failed ? 'text-vl-danger' : 'text-vl-ok'}`}>{shown.title}</p>
            <p className="mt-1 text-sm">{shown.text}</p>
          </div>
        )}
      </div>
    </section>
  );
}
