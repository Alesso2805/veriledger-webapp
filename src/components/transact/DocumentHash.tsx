import { useState, type ChangeEvent } from 'react';
import { sha256Hex } from '../../lib/digest';
import { shortHash } from '../../lib/format';
import type { Messages } from '../../lib/i18n';
import { Fingerprint } from '../Fingerprint';
import { useT } from '../useT';

type Hashing =
  | { phase: 'idle' }
  | { phase: 'hashing'; name: string }
  | { phase: 'done'; name: string; hash: string }
  | { phase: 'failed'; name: string };

function noteFor(state: Hashing, words: Messages['transact']['document']): string {
  switch (state.phase) {
    case 'idle':
      return words.none;
    case 'hashing':
      return words.hashing(state.name);
    case 'done':
      return `${state.name} · SHA-256 ${shortHash(state.hash, 8)}`;
    case 'failed':
      return words.unreadable(state.name);
  }
}

// The document is hashed here and never sent; only its SHA-256 becomes the payload.
export function DocumentHash({ onHashed }: { onHashed: (payload: string | null) => void }) {
  const words = useT().transact.document;
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
      <label className="relative flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-[1.5px] border-dashed border-vl-line p-[18px] text-center transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vl-accent">
        <span className="font-bold">{words.choose}</span>
        <span className="text-sm text-vl-muted">{words.private}</span>
        <input type="file" onChange={(event) => void choose(event)} className="absolute size-px opacity-0" />
      </label>
      {state.phase === 'done' && (
        <Fingerprint key={state.hash} hex={state.hash} bars={8} className="mt-2.5 h-3.5 max-w-[220px] gap-[2px]" radius={3} grow />
      )}
      {/* No percentage while hashing: crypto.subtle.digest gives none (DESIGN.md › What the design does not show). */}
      <p
        key={state.phase}
        aria-live="polite"
        className={`mt-2 font-vl-mono text-[13px] [overflow-wrap:anywhere] ${state.phase === 'failed' ? 'text-vl-danger' : 'text-vl-muted'} ${
          state.phase === 'hashing' ? 'animate-vl-pulse' : state.phase === 'done' ? 'animate-vl-fade-up' : ''
        }`}
      >
        {noteFor(state, words)}
      </p>
    </div>
  );
}
