import { useState, type ChangeEvent } from 'react';
import { sha256Hex } from '../../lib/digest';
import { shortHash } from '../../lib/format';

type Hashing =
  | { phase: 'idle' }
  | { phase: 'hashing'; name: string }
  | { phase: 'done'; name: string; hash: string }
  | { phase: 'failed'; name: string };

function noteFor(state: Hashing): string {
  switch (state.phase) {
    case 'idle':
      return 'No document chosen yet.';
    case 'hashing':
      return `Hashing ${state.name}…`;
    case 'done':
      return `${state.name} · SHA-256 ${shortHash(state.hash, 8)}`;
    case 'failed':
      return `${state.name} could not be read.`;
  }
}

// The document is hashed here and never sent; only its fingerprint becomes the payload.
export function DocumentHash({ onHashed }: { onHashed: (payload: string | null) => void }) {
  const [state, setState] = useState<Hashing>({ phase: 'idle' });

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setState({ phase: 'hashing', name: file.name });
    onHashed(null);
    try {
      const hash = await sha256Hex(await file.arrayBuffer());
      setState({ phase: 'done', name: file.name, hash });
      onHashed(hash);
    } catch {
      setState({ phase: 'failed', name: file.name });
    }
  };

  return (
    <div className="animate-vl-fade-up">
      <label className="relative flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-vl-line p-4 text-center transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vl-accent">
        <span className="font-semibold">Choose the document</span>
        <span className="text-[13px] text-vl-muted">
          Its SHA-256 fingerprint is computed here. The file never leaves this device.
        </span>
        <input type="file" onChange={(event) => void choose(event)} className="absolute size-px opacity-0" />
      </label>
      {/* No percentage while hashing: crypto.subtle.digest gives none (DESIGN.md › What the design does not show). */}
      <p
        key={state.phase}
        aria-live="polite"
        className={`mt-2 font-vl-mono text-xs [overflow-wrap:anywhere] ${state.phase === 'failed' ? 'text-vl-danger' : 'text-vl-muted'} ${
          state.phase === 'hashing' ? 'animate-vl-pulse' : state.phase === 'done' ? 'animate-vl-fade-up' : ''
        }`}
      >
        {noteFor(state)}
      </p>
    </div>
  );
}
