import { useEffect, useState, type ChangeEvent } from 'react';
import { sha256Hex } from '../../lib/digest';
import { ON_INK } from '../../lib/fingerprint';
import { certifiedParts } from '../../lib/format';
import { hashGroups } from '../../lib/transaction';
import { getBlock } from '../../services/ledger';
import { Fingerprint } from '../Fingerprint';
import { useLanguage, useT } from '../useT';

type Check =
  | { phase: 'idle' }
  | { phase: 'hashing' | 'failed'; name: string }
  | { phase: 'match' | 'mismatch'; name: string; hash: string };

interface Props {
  payload: string;
  blockNumber: number;
  blockHash: string;
}

// A sealed notarization's proof of existence, on ink in both themes. The moment it states is the block's seal, which
// the chain backs, not the time the node received the transaction. A file checked here is hashed in the browser and
// never sent; its fingerprint sits under the certified one, so a mismatch shows bar by bar.
export function Certificate({ payload, blockNumber, blockHash }: Props) {
  const words = useT().transaction.certificate;
  const language = useLanguage();
  const [sealedAt, setSealedAt] = useState<string | null>(null);
  const [check, setCheck] = useState<Check>({ phase: 'idle' });
  const certifiedHash = payload.toLowerCase();

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
      setCheck({ phase: hash === certifiedHash ? 'match' : 'mismatch', name: file.name, hash });
    } catch {
      setCheck({ phase: 'failed', name: file.name });
    }
  };

  const certified = sealedAt === null ? null : certifiedParts(sealedAt, language);

  return (
    <section aria-labelledby="cert-h" className="animate-vl-fade-up rounded-3xl bg-vl-ink p-6 text-vl-on-ink max-sm:p-[18px]">
      <p className="font-vl-mono text-xs" style={{ color: ON_INK.info }}>
        {words.kicker}
      </p>
      <h2 id="cert-h" className="mt-1.5 text-2xl leading-[1.2] font-extrabold tracking-[-0.02em]">
        {certified ? words.existed(certified.day, certified.time) : words.existedWhen(blockNumber)}
      </h2>
      <p className="mt-3.5 mb-1.5 text-sm text-vl-on-ink-muted">{words.sealedFingerprint(blockNumber)}</p>
      <Fingerprint hex={certifiedHash} bars={8} className="h-7 gap-[3px]" onInk />
      {/* Four groups a row in the artboard's width; fewer on a phone, where eight characters need their room. */}
      <ol
        aria-label={words.groups}
        className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-1 font-vl-mono text-xs"
      >
        {hashGroups(payload).map((group, index) => (
          <li key={index} className="rounded-lg bg-vl-ink-raised p-1.5 text-center">
            {group}
          </li>
        ))}
      </ol>
      <h3 className="mt-5 mb-2 font-bold">{words.check}</h3>
      <label className="relative flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-[1.5px] border-dashed border-vl-ink-line p-[18px] text-center transition-colors duration-(--vl-dur-fast) hover:bg-vl-ink-raised has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vl-accent">
        <span className="font-bold">{words.choose}</span>
        <span className="text-sm text-vl-on-ink-muted">{words.private}</span>
        <input type="file" onChange={(event) => void choose(event)} className="absolute size-px opacity-0" />
      </label>
      <div aria-live="polite">
        {check.phase === 'hashing' && (
          <p className="mt-3 animate-vl-pulse text-[15px] text-vl-on-ink-muted">{words.hashing(check.name)}</p>
        )}
        {(check.phase === 'match' || check.phase === 'mismatch') && (
          <div
            key={`${check.phase}-${check.hash}`}
            className={`mt-3.5 rounded-2xl bg-vl-ink-raised p-3.5 ${check.phase === 'match' ? 'animate-vl-fade-up' : 'animate-vl-shake'}`}
          >
            <p className="mb-2 text-[17px] font-extrabold" style={{ color: check.phase === 'match' ? ON_INK.ok : ON_INK.refused }}>
              {check.phase === 'match' ? words.match : words.noMatch}
            </p>
            <p className="mb-1 text-[13px] text-vl-on-ink-muted">{words.certified}</p>
            <Fingerprint hex={certifiedHash} bars={8} className="h-4 gap-[3px]" radius={3} onInk />
            <p className="mt-2 mb-1 text-[13px] text-vl-on-ink-muted [overflow-wrap:anywhere]">{check.name}</p>
            <Fingerprint hex={check.hash} bars={8} className="h-4 gap-[3px]" radius={3} onInk grow />
            <p className="mt-2.5 text-sm">
              {check.phase === 'match' ? words.matchText(check.name) : words.noMatchText(check.name)}
            </p>
          </div>
        )}
        {check.phase === 'failed' && (
          <p className="mt-3 text-sm" style={{ color: ON_INK.refused }}>
            {words.unreadable(check.name)}
          </p>
        )}
      </div>
    </section>
  );
}
