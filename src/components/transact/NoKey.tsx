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
      className="mt-6 max-w-[640px] animate-vl-fade-up rounded-2xl border border-vl-line bg-vl-surface p-6"
    >
      <h2 id="no-key-h" className="text-xl font-bold">
        {t.transact.noKeyTitle}
      </h2>
      <p className="mt-1.5 mb-4 text-vl-muted">
        {t.transact.noKeyText}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <label className="relative inline-flex h-11 cursor-pointer items-center rounded-[10px] bg-vl-accent px-4 font-semibold text-vl-on-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vl-accent">
          {t.transact.openKeyFile}
          <input type="file" accept="application/json" onChange={(event) => void open(event)} className="absolute size-px opacity-0" />
        </label>
        <Link to="/wallet" className="inline-flex h-11 items-center rounded-[10px] border border-vl-line px-4 font-semibold">
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
