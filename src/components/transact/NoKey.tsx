import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { KeyFileError, parseKeyFile } from '../../lib/keyFile';
import { useKeyStore } from '../../store/useKeyStore';
import { useT } from '../useT';

// Keys are never stored (ADR-0002), so a new tab starts here: open the saved key file, or make a wallet.
export function NoKey() {
  const t = useT();
  const hold = useKeyStore((state) => state.hold);
  const [error, setError] = useState<string | null>(null);

  const open = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cleared, so choosing the same file again after a mistake still fires a change.
    event.target.value = '';
    if (!file) return;
    try {
      // A key that comes from its file is already saved.
      hold(parseKeyFile(await file.text()), true);
    } catch (failure) {
      setError(failure instanceof KeyFileError ? t.keyFile[failure.reason] : t.keyFile.unreadable);
    }
  };

  return (
    <section
      aria-labelledby="no-key-h"
      className="mt-6 max-w-[660px] animate-vl-fade-up rounded-[28px] bg-vl-surface p-7 max-sm:p-[18px]"
    >
      <h2 id="no-key-h" className="text-[26px] font-extrabold tracking-[-0.02em]">
        {t.transact.noKeyTitle}
      </h2>
      <p className="mt-1.5 mb-[18px] text-vl-muted">{t.transact.noKeyText}</p>
      <div className="flex flex-wrap gap-2.5">
        <label className="relative inline-flex h-[50px] cursor-pointer items-center rounded-[14px] bg-vl-accent px-[22px] font-bold text-vl-on-accent has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vl-accent">
          {t.transact.openKeyFile}
          <input type="file" accept="application/json" onChange={(event) => void open(event)} className="absolute size-px opacity-0" />
        </label>
        <Link
          to="/wallet"
          className="inline-flex h-[50px] items-center rounded-[14px] border-[1.5px] border-vl-line px-[22px] font-bold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
        >
          {t.transact.createWallet}
        </Link>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-vl-danger">
          {error}
        </p>
      )}
    </section>
  );
}
