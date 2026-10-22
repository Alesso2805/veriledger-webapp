import { useState, type FormEvent } from 'react';
import { looksLikePeerUrl } from '../../lib/peers';
import { detailOf } from '../../services/api';
import { registerPeer } from '../../services/nodes';
import { useT } from '../useT';

interface Props {
  // Registering needs the admin role (VLA-19); the others are told so and can still look.
  admin: boolean;
  onAdded: (url: string) => void;
}

export function AddPeer({ admin, onAdded }: Props) {
  const words = useT().network.add;
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  // The API's own words when it refuses, such as a private address.
  const [refusal, setRefusal] = useState<string | null>(null);
  // Counts refusals only, so typing after one keeps the form (and its focus) while each new refusal shakes it.
  const [attempt, setAttempt] = useState(0);

  const refuse = (text: string) => {
    setRefusal(text);
    setAttempt((count) => count + 1);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const address = url.trim();
    if (!looksLikePeerUrl(address)) {
      refuse(words.format);
      return;
    }
    setAdding(true);
    setRefusal(null);
    try {
      await registerPeer(address);
      setUrl('');
      onAdded(address);
    } catch (error) {
      refuse(detailOf(error, words.noAnswer));
    } finally {
      setAdding(false);
    }
  };

  return (
    <section aria-labelledby="add-h" className="rounded-3xl bg-vl-surface p-6 max-sm:p-5">
      <h2 id="add-h" className="text-[22px] font-bold tracking-[-0.02em]">
        {words.title}
      </h2>
      {admin ? (
        <form
          key={attempt}
          onSubmit={(event) => void submit(event)}
          className={`mt-3 flex flex-col gap-2 ${refusal ? 'animate-vl-shake' : ''}`}
        >
          <label htmlFor="url" className="text-sm font-medium">
            {words.address}
          </label>
          <input
            id="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setRefusal(null);
            }}
            placeholder="https://node-e.example.org"
            aria-describedby="url-help"
            aria-invalid={refusal !== null}
            autoComplete="off"
            spellCheck={false}
            className={`h-[50px] rounded-[14px] border-[1.5px] bg-vl-surface px-3.5 font-vl-mono text-sm transition-colors duration-(--vl-dur-fast) ${
              refusal ? 'border-vl-danger' : 'border-vl-line'
            }`}
          />
          <p id="url-help" aria-live="polite" className={`text-sm ${refusal ? 'text-vl-danger' : 'text-vl-muted'}`}>
            {refusal ?? words.help}
          </p>
          <button
            type="submit"
            disabled={adding}
            className="h-12 self-start rounded-[14px] bg-vl-strong px-5 text-[15px] font-bold text-vl-on-strong"
          >
            {adding ? words.adding : words.button}
          </button>
        </form>
      ) : (
        <p className="mt-2 text-[15px] text-vl-muted">{words.onlyAdmin}</p>
      )}
    </section>
  );
}
