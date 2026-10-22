import { useState } from 'react';
import { ON_INK, PALETTE } from '../../lib/fingerprint';
import { keyFileText } from '../../lib/keyFile';
import { useKeyStore } from '../../store/useKeyStore';
import type { Wallet } from '../../types/ledger';
import { useT } from '../useT';

// The key's two saving steps, and forgetting it, on ink in both themes. Both panels open and close with
// grid-template-rows (DESIGN.md › Motion map), and the confirmation is inline: a browser dialog would stop the page.
export function KeyCard({ pair }: { pair: Wallet }) {
  const words = useT().wallet.key;
  const saved = useKeyStore((state) => state.saved);
  const markSaved = useKeyStore((state) => state.markSaved);
  const forget = useKeyStore((state) => state.forget);
  const [downloaded, setDownloaded] = useState(saved);
  const [asking, setAsking] = useState(false);

  // The file is made in the browser with a Blob; nothing is sent anywhere.
  const download = () => {
    const url = URL.createObjectURL(new Blob([keyFileText(pair)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `veriledger-${pair.public_key.slice(0, 8)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  };

  const panel = (open: boolean) =>
    `grid transition-[grid-template-rows] duration-(--vl-dur-slow) ease-vl-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`;
  const waitingRing = 'shadow-[inset_0_0_0_2px_var(--color-vl-wait)]';

  return (
    <section
      aria-labelledby="key-h"
      className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-[28px] bg-vl-ink p-7 text-vl-on-ink max-sm:p-5"
    >
      <h2 id="key-h" className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em]">
        {saved ? words.savedTitle : words.unsavedTitle}
      </h2>
      <p className="text-vl-on-ink-muted">{saved ? words.savedText : words.unsavedText}</p>
      <div className={panel(!saved)}>
        <div className="min-h-0 overflow-hidden" inert={saved} aria-hidden={saved}>
          <ol className="flex flex-col gap-2.5 p-0.5">
            <li className={`flex flex-wrap items-center gap-2.5 rounded-2xl bg-vl-ink-raised px-3.5 py-3 ${downloaded ? '' : waitingRing}`}>
              <span className="flex-auto">{words.step1}</span>
              {downloaded ? (
                <span className="flex animate-vl-pop items-center gap-1.5 text-[15px]" style={{ color: ON_INK.ok }}>
                  <svg width="20" height="20" viewBox="0 0 22 22" aria-hidden="true">
                    <circle cx="11" cy="11" r="10" style={{ fill: ON_INK.ok }} />
                    <path d="M6.5 11.5l3 3 6-6.5" fill="none" strokeWidth="2" style={{ stroke: PALETTE[4] }} />
                  </svg>
                  {words.saved}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={download}
                  className="h-11 rounded-xl bg-vl-wait px-3.5 text-[15px] font-bold text-vl-on-wait"
                >
                  {words.download}
                </button>
              )}
            </li>
            <li
              className={`flex items-center gap-3 rounded-2xl bg-vl-ink-raised px-3.5 py-3 transition-opacity duration-(--vl-dur-base) ${
                downloaded ? waitingRing : 'opacity-55'
              }`}
            >
              <input
                id="kept"
                type="checkbox"
                checked={saved}
                disabled={!downloaded}
                onChange={(event) => event.target.checked && markSaved()}
                className="size-[22px]"
                style={{ accentColor: ON_INK.ok }}
              />
              <label htmlFor="kept">{words.step2}</label>
            </li>
          </ol>
        </div>
      </div>
      <div className={panel(asking)}>
        <div className="min-h-0 overflow-hidden" inert={!asking} aria-hidden={!asking}>
          <div
            className="flex flex-col gap-2.5 rounded-2xl bg-vl-ink-danger p-3.5"
            style={{ boxShadow: `inset 0 0 0 1.5px ${ON_INK.refused}` }}
          >
            <p className="text-[15px]">{words.ask}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={forget}
                className="h-11 rounded-xl px-3.5 text-[15px] font-bold"
                style={{ background: ON_INK.refused, color: PALETTE[4] }}
              >
                {words.forget}
              </button>
              <button
                type="button"
                onClick={() => setAsking(false)}
                className="h-11 rounded-xl border-[1.5px] border-vl-ink-line px-3.5 text-[15px] font-bold"
              >
                {words.keep}
              </button>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="min-h-11 self-start text-[15px] font-medium text-vl-on-ink-muted underline"
      >
        {words.forgetLink}
      </button>
    </section>
  );
}
