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

  const card = 'min-w-0 flex-[1_1_360px] rounded-[28px] bg-vl-surface p-7 max-sm:p-5';
  const title = 'text-[26px] font-extrabold tracking-[-0.02em]';

  return (
    <div className="mt-6 flex animate-vl-fade-up flex-wrap gap-[22px]">
      <section aria-labelledby="create-h" className={card}>
        <h2 id="create-h" className={title}>
          {t.wallet.createTitle}
        </h2>
        <p className="mt-1.5 mb-[18px] text-vl-muted">{t.wallet.createText}</p>
        <button
          type="button"
          onClick={create}
          className="h-[52px] rounded-2xl bg-vl-accent px-6 font-bold text-vl-on-accent"
        >
          {t.wallet.create}
        </button>
      </section>
      <section aria-labelledby="open-h" className={card}>
        <h2 id="open-h" className={title}>
          {t.wallet.openTitle}
        </h2>
        <p className="mt-1.5 mb-[18px] text-vl-muted">{t.wallet.openText}</p>
        <label className="relative inline-flex h-[52px] cursor-pointer items-center rounded-2xl border-[1.5px] border-vl-line px-6 font-bold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vl-accent">
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
