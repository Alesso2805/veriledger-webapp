import { useT } from '../useT';

// The signature appears with animate-vl-reveal when it is made; an edit after signing discards it.
export function SignaturePanel({ signature, stale }: { signature: string | null; stale: boolean }) {
  const words = useT().transact.signature;
  return (
    <div
      aria-live="polite"
      className={`rounded-2xl border bg-vl-surface px-4 py-3.5 transition-colors duration-(--vl-dur-slow) ${
        signature ? 'border-vl-accent' : 'border-vl-line'
      }`}
    >
      <div className="flex justify-between gap-3 text-[13px] text-vl-muted">
        <span>{words.title}</span>
        <span className="font-vl-mono">{words.size}</span>
      </div>
      {signature ? (
        <div key={signature} className="mt-1.5 animate-vl-reveal font-vl-mono text-xs [overflow-wrap:anywhere]">
          {signature}
        </div>
      ) : (
        <div className={`mt-1.5 text-sm ${stale ? 'text-vl-accent' : 'text-vl-muted'}`}>
          {stale ? words.stale : words.none}
        </div>
      )}
    </div>
  );
}
