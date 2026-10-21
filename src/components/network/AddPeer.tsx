import { useState, type FormEvent } from 'react';
import { looksLikePeerUrl } from '../../lib/peers';
import { detailOf } from '../../services/api';
import { registerPeer } from '../../services/nodes';

interface Props {
  // Registering needs the admin role (VLA-19); the others are told so and can still look.
  admin: boolean;
  onAdded: (url: string) => void;
}

const HELP = 'The peer’s public address, starting with http:// or https://.';

export function AddPeer({ admin, onAdded }: Props) {
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
      refuse('Use a full address that starts with http:// or https://.');
      return;
    }
    setAdding(true);
    setRefusal(null);
    try {
      await registerPeer(address);
      setUrl('');
      onAdded(address);
    } catch (error) {
      refuse(detailOf(error, 'The node did not answer'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <section aria-labelledby="add-h" className="rounded-2xl border border-vl-line bg-vl-surface p-5">
      <h2 id="add-h" className="text-[17px] font-bold">
        Add a peer
      </h2>
      {admin ? (
        <form
          key={attempt}
          onSubmit={(event) => void submit(event)}
          className={`mt-3 flex flex-col gap-2 ${refusal ? 'animate-vl-shake' : ''}`}
        >
          <label htmlFor="url" className="text-[13px] font-medium">
            Peer address
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
            className={`h-11 rounded-[10px] border bg-vl-bg px-3 font-vl-mono text-[13px] transition-colors duration-(--vl-dur-fast) ${
              refusal ? 'border-vl-danger' : 'border-vl-line'
            }`}
          />
          <p id="url-help" aria-live="polite" className={`text-[13px] ${refusal ? 'text-vl-danger' : 'text-vl-muted'}`}>
            {refusal ?? HELP}
          </p>
          <button
            type="submit"
            disabled={adding}
            className="h-[42px] self-start rounded-[10px] bg-vl-text px-3.5 text-sm font-semibold text-vl-on-accent"
          >
            {adding ? 'Adding…' : 'Add peer'}
          </button>
        </form>
      ) : (
        <p className="mt-2 text-sm text-vl-muted">
          Only an admin can add peers or resolve conflicts. You can still see who this node talks to.
        </p>
      )}
    </section>
  );
}
