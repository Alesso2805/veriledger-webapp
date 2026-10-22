import { Fingerprint } from '../Fingerprint';
import { useT } from '../useT';

// The signature appears with animate-vl-reveal when it is made, its fingerprint's bars growing above it; an edit
// after signing discards it.
export function SignaturePanel({ signature, stale }: { signature: string | null; stale: boolean }) {
  const words = useT().transact.signature;
  return (
    <div
      aria-live="polite"
      className={`rounded-[20px] bg-vl-surface px-5 py-4 transition-shadow duration-(--vl-dur-slow) ${
        signature ? 'shadow-[inset_0_0_0_2px_var(--color-vl-accent)]' : 'shadow-[inset_0_0_0_2px_transparent]'
      }`}
    >
      <div className="flex justify-between gap-3 text-sm text-vl-muted">
        <span>{words.title}</span>
        <span className="font-vl-mono">{words.size}</span>
      </div>
      {signature ? (
        <div key={signature}>
          <Fingerprint hex={signature} bars={16} className="mt-2.5 h-4 gap-[2px]" radius={3} grow />
          <div className="mt-2 animate-vl-reveal font-vl-mono text-[13px] [overflow-wrap:anywhere]">{signature}</div>
        </div>
      ) : (
        <div className={`mt-1.5 text-[15px] ${stale ? 'text-vl-accent' : 'text-vl-muted'}`}>{stale ? words.stale : words.none}</div>
      )}
    </div>
  );
}
