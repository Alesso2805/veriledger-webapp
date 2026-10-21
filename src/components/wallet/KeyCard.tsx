import { useState } from 'react';
import { keyFileText } from '../../lib/keyFile';
import { useKeyStore } from '../../store/useKeyStore';
import type { Wallet } from '../../types/ledger';

// The key's two saving steps, and forgetting it. Both panels open and close with grid-template-rows
// (DESIGN.md › Motion map), and the confirmation is inline: a browser dialog would stop the page.
export function KeyCard({ pair }: { pair: Wallet }) {
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

  return (
    <section
      aria-labelledby="key-h"
      className={`flex min-w-0 flex-[1_1_340px] flex-col gap-3 rounded-2xl border bg-vl-surface p-[22px] transition-colors duration-(--vl-dur-slow) ${
        saved ? 'border-vl-line' : 'border-vl-accent'
      }`}
    >
      <h2 id="key-h" className="text-lg font-bold">
        {saved ? 'Your key is saved' : 'Save your key now'}
      </h2>
      <p className="text-sm text-vl-muted">
        {saved
          ? 'Keep the file where only you can reach it. Anyone who has it can spend from this wallet.'
          : 'It exists only in this tab. If you close it without saving the file, this wallet is lost for good.'}
      </p>
      <div className={panel(!saved)}>
        <div className="min-h-0 overflow-hidden" inert={saved} aria-hidden={saved}>
          <ol className="flex flex-col gap-2 p-0.5">
            <li className="flex flex-wrap items-center gap-2.5 rounded-[10px] bg-vl-bg px-3 py-2.5">
              <span className="flex-auto">1 · Save the key file</span>
              {downloaded ? (
                <span className="flex animate-vl-pop items-center gap-1.5 text-[13px] text-vl-ok">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <path d="M2.5 7.5l3 3L11.5 4" fill="none" strokeWidth="2" className="stroke-vl-ok" />
                  </svg>
                  Saved
                </span>
              ) : (
                <button
                  type="button"
                  onClick={download}
                  className="h-9 rounded-lg bg-vl-accent px-3 text-[13px] font-semibold text-vl-on-accent"
                >
                  Download .json
                </button>
              )}
            </li>
            <li
              className={`flex items-center gap-2.5 rounded-[10px] bg-vl-bg px-3 py-2.5 transition-opacity duration-(--vl-dur-base) ${
                downloaded ? '' : 'opacity-50'
              }`}
            >
              <input
                id="kept"
                type="checkbox"
                checked={saved}
                disabled={!downloaded}
                onChange={(event) => event.target.checked && markSaved()}
                className="size-5 accent-vl-accent"
              />
              <label htmlFor="kept">2 · I stored it somewhere safe</label>
            </li>
          </ol>
        </div>
      </div>
      <div className={panel(asking)}>
        <div className="min-h-0 overflow-hidden" inert={!asking} aria-hidden={!asking}>
          <div className="flex flex-col gap-2.5 rounded-[10px] border border-vl-danger p-3">
            <p className="text-sm">Forget this key in this tab? You will need the key file to sign with this wallet again.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={forget}
                className="h-9 rounded-lg bg-vl-danger px-3 text-[13px] font-semibold text-vl-on-accent"
              >
                Forget it
              </button>
              <button
                type="button"
                onClick={() => setAsking(false)}
                className="h-9 rounded-lg border border-vl-line px-3 text-[13px] font-semibold"
              >
                Keep it
              </button>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="h-9 self-start text-[13px] font-medium text-vl-muted underline"
      >
        Forget this key in this tab
      </button>
    </section>
  );
}
