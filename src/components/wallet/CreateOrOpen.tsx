import { useState, type ChangeEvent } from 'react';
import { KeyFileError, parseKeyFile } from '../../lib/keyFile';
import { generateKeyPair } from '../../lib/keys';
import { useKeyStore } from '../../store/useKeyStore';
import { useT } from '../useT';

// No key in this tab yet: make a new pair here, or open the file of one made before.
export function CreateOrOpen({ onReady }: { onReady: () => void }) {
  const t = useT();
  const hold = useKeyStore((state) => state.hold);
  const [error, setError] = useState<string | null>(null);

  const create = () => {
    // Nobody has a file of a pair made a moment ago, so the wallet asks to save it.
    hold(generateKeyPair(), false);
    onReady();
  };

  const open = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      hold(parseKeyFile(await file.text()), true);
      onReady();
    } catch (failure) {
      setError(failure instanceof KeyFileError ? t.keyFile[failure.reason] : t.keyFile.unreadable);
    }
  };

  const card = 'min-w-0 flex-[1_1_360px] rounded-2xl border border-vl-line bg-vl-surface p-6';

  return (
    <div className="mt-6 flex animate-vl-fade-up flex-wrap gap-4">
      <section aria-labelledby="create-h" className={card}>
        <h2 id="create-h" className="text-xl font-bold">
          {t.wallet.createTitle}
        </h2>
        <p className="mt-1.5 mb-[18px] text-vl-muted">{t.wallet.createText}</p>
        <button
          type="button"
          onClick={create}
          className="h-[46px] rounded-[10px] bg-vl-accent px-[18px] font-semibold text-vl-on-accent"
        >
          {t.wallet.create}
        </button>
      </section>
      <section aria-labelledby="open-h" className={card}>
        <h2 id="open-h" className="text-xl font-bold">
          {t.wallet.openTitle}
        </h2>
        <p className="mt-1.5 mb-[18px] text-vl-muted">{t.wallet.openText}</p>
        <label className="relative inline-flex h-[46px] cursor-pointer items-center rounded-[10px] border border-vl-line px-[18px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vl-accent">
          {t.wallet.open}
          <input type="file" accept="application/json" onChange={(event) => void open(event)} className="absolute size-px opacity-0" />
        </label>
        {error && (
          <p role="alert" className="mt-3 text-sm text-vl-danger">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
