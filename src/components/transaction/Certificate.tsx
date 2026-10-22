import { useEffect, useState, type ChangeEvent } from 'react';
import { sha256Hex } from '../../lib/digest';
import { formatCertified } from '../../lib/format';
import { fingerprintGroups } from '../../lib/transaction';
import { getBlock } from '../../services/ledger';

type Check = { phase: 'idle' } | { phase: 'hashing' | 'match' | 'mismatch' | 'failed'; name: string };

interface Props {
  payload: string;
  blockNumber: number;
  blockHash: string;
}

// A sealed notarization's proof of existence. The moment it states is the block's seal, which the chain backs,
// not the time the node received the transaction. A file checked here is hashed in the browser and never sent.
export function Certificate({ payload, blockNumber, blockHash }: Props) {
  const [sealedAt, setSealedAt] = useState<string | null>(null);
  const [check, setCheck] = useState<Check>({ phase: 'idle' });

  useEffect(() => {
    let active = true;
    getBlock(blockHash).then(
      (block) => active && setSealedAt(block.timestamp),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [blockHash]);

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setCheck({ phase: 'hashing', name: file.name });
    try {
      const hash = await sha256Hex(await file.arrayBuffer());
      setCheck({ phase: hash === payload.toLowerCase() ? 'match' : 'mismatch', name: file.name });
    } catch {
      setCheck({ phase: 'failed', name: file.name });
    }
  };

  const certified = sealedAt === null ? null : formatCertified(sealedAt);

  return (
    <section
      aria-labelledby="cert-h"
      className="animate-vl-fade-up rounded-2xl border border-vl-accent bg-vl-surface p-[22px]"
    >
      <p className="font-vl-mono text-[11px] text-vl-accent">PROOF OF EXISTENCE</p>
      <h2 id="cert-h" className="mt-1 text-xl leading-[1.25] font-bold">
        {certified
          ? `This document existed on ${certified}.`
          : `This document existed when block #${blockNumber} was sealed.`}
      </h2>
      {/* Four groups a row in the artboard's width; fewer on a phone, where eight characters need their room. */}
      <ol
        aria-label="Document fingerprint, SHA-256"
        className="mt-3.5 grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-1 font-vl-mono text-xs"
      >
        {fingerprintGroups(payload).map((group, index) => (
          <li key={index} className="rounded-md bg-vl-bg p-1.5 text-center">
            {group}
          </li>
        ))}
      </ol>
      <h3 className="mt-[18px] mb-2 text-sm font-semibold">Check a file against it</h3>
      <label className="relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-vl-line p-[18px] text-center transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vl-accent">
        <span className="font-semibold">Choose a file</span>
        <span className="text-[13px] text-vl-muted">It is hashed in your browser and never uploaded.</span>
        <input type="file" onChange={(event) => void choose(event)} className="absolute size-px opacity-0" />
      </label>
      <div aria-live="polite">
        {check.phase === 'hashing' && (
          <p className="mt-3 animate-vl-pulse text-sm text-vl-muted">Hashing {check.name} in your browser…</p>
        )}
        {check.phase === 'match' && (
          <div key={`match-${check.name}`} className="mt-3 animate-vl-fade-up rounded-[10px] border border-vl-ok bg-vl-bg p-3">
            <p className="font-semibold text-vl-ok">Match</p>
            <p className="mt-1 text-sm">{check.name} is exactly the certified document.</p>
          </div>
        )}
        {check.phase === 'mismatch' && (
          <div key={`mismatch-${check.name}`} className="mt-3 animate-vl-shake rounded-[10px] border border-vl-danger bg-vl-bg p-3">
            <p className="font-semibold text-vl-danger">No match</p>
            <p className="mt-1 text-sm">
              {check.name} differs from the certified document. One changed character changes the whole fingerprint.
            </p>
          </div>
        )}
        {check.phase === 'failed' && <p className="mt-3 text-sm text-vl-danger">{check.name} could not be read.</p>}
      </div>
    </section>
  );
}
