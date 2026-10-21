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

function outcome(result: ResolveResult): { title: string; text: string } {
  switch (result.kind) {
    case 'kept':
      return { title: 'Our chain is already the longest valid one', text: 'No peer had a longer valid chain. Nothing changed.' };
    case 'replaced':
      return {
        title: 'Adopted a longer valid chain',
        text: `Height went from ${result.before ?? '—'} to ${result.after ?? '—'}. Every block was checked before replacing ours.`,
      };
    case 'failed':
      return { title: 'Could not finish resolving', text: `${result.detail.replace(/\.$/, '')}. Nothing changed; try again.` };
  }
}

// Resolving asks every peer for its chain (VLA-19). While it runs, pulses travel to the peers on the map.
export function ResolveCard({ admin, peerCount, phase, result, onResolve }: Props) {
  const ready = admin && peerCount > 0 && phase !== 'resolving';
  const shown = result ? outcome(result) : null;
  const failed = result?.kind === 'failed';

  return (
    <section aria-labelledby="resolve-h" className="rounded-2xl border border-vl-line bg-vl-surface p-5">
      <h2 id="resolve-h" className="text-[17px] font-bold">
        Resolve conflicts
      </h2>
      <p className="mt-1.5 mb-3.5 text-sm text-vl-muted">
        Asks every peer for its chain. If one is longer and fully valid, this node adopts it.
      </p>
      <button
        type="button"
        onClick={onResolve}
        disabled={!ready}
        className={`h-11 rounded-[10px] px-4 font-semibold transition-colors duration-(--vl-dur-base) ${
          ready ? 'bg-vl-accent text-vl-on-accent' : 'bg-vl-line text-vl-muted'
        }`}
      >
        {phase === 'resolving' ? `Asking ${peerCount} ${peerCount === 1 ? 'peer' : 'peers'}…` : 'Resolve conflicts'}
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
