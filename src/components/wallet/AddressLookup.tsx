import { useState, type FormEvent } from 'react';
import { formatAmount } from '../../lib/format';
import { partialCube } from '../../lib/identicon';
import { detailOf } from '../../services/api';
import { getBalance } from '../../services/wallets';
import { useT } from '../useT';

type Result =
  | { phase: 'idle' }
  | { phase: 'balance'; balance: number }
  | { phase: 'bad'; id: number }
  | { phase: 'failed'; detail: string };

const HEX64 = /^[0-9a-f]{64}$/;

// Any address's balance. Its cube is built as the person types, a face for each complete byte.
export function AddressLookup() {
  const words = useT().wallet.lookup;
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<Result>({ phase: 'idle' });
  const address = typed.trim().toLowerCase();
  const valid = HEX64.test(address);
  const cube = partialCube(address);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) {
      // A new id replays the shake on every wrong try.
      setResult((current) => ({ phase: 'bad', id: current.phase === 'bad' ? current.id + 1 : 0 }));
      return;
    }
    try {
      setResult({ phase: 'balance', balance: await getBalance(address) });
    } catch (error) {
      setResult({ phase: 'failed', detail: detailOf(error, words.noAnswer) });
    }
  };

  const face = (color: string | null, empty: string) =>
    color
      ? { fill: color, className: 'transition-[fill] duration-(--vl-dur-base)' }
      : { className: `${empty} transition-[fill] duration-(--vl-dur-base)` };

  return (
    <section
      aria-labelledby="look-h"
      className="min-w-0 flex-[1_1_340px] rounded-2xl border border-vl-line bg-vl-surface p-[22px]"
    >
      <h2 id="look-h" className="text-[15px] font-semibold">
        {words.title}
      </h2>
      <form onSubmit={(event) => void submit(event)} className="mt-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <svg width="44" height="40" viewBox="0 0 44 40" aria-hidden="true">
            <polygon points="22,3 41,12 22,21 3,12" {...face(cube.top, 'fill-vl-line')} />
            <polygon points="3,12 22,21 22,37 3,28" {...face(cube.left, 'fill-vl-raised')} />
            <polygon points="22,21 41,12 41,28 22,37" {...face(cube.right, 'fill-vl-line-soft')} />
          </svg>
          <span className="font-vl-mono text-xs text-vl-muted">{address.length} / 64</span>
        </div>
        <label htmlFor="other" className="text-[13px] font-medium">
          {words.address}
        </label>
        <input
          id="other"
          value={typed}
          onChange={(event) => {
            setTyped(event.target.value);
            setResult({ phase: 'idle' });
          }}
          placeholder={words.placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`h-11 rounded-[10px] border bg-vl-bg px-3 font-vl-mono text-xs transition-colors duration-(--vl-dur-fast) ${
            valid ? 'border-vl-ok' : address ? 'border-vl-accent' : 'border-vl-line'
          }`}
        />
        <div>
          <button type="submit" className="h-[42px] rounded-[10px] bg-vl-text px-3.5 text-sm font-semibold text-vl-on-accent">
            {words.show}
          </button>
        </div>
      </form>
      <div aria-live="polite">
        {result.phase === 'balance' && (
          <p className="mt-3.5 animate-vl-fade-up font-vl-mono text-[22px]">{formatAmount(result.balance)} VL</p>
        )}
        {result.phase === 'bad' && (
          <p key={result.id} className="mt-3.5 animate-vl-shake text-sm text-vl-danger">
            {words.invalid}
          </p>
        )}
        {result.phase === 'failed' && <p className="mt-3.5 text-sm text-vl-danger">{result.detail}</p>}
      </div>
    </section>
  );
}
