import { useState, type FormEvent } from 'react';
import { formatAmount, shortHash } from '../../lib/format';
import { detailOf } from '../../services/api';
import { getBalance } from '../../services/wallets';
import { Fingerprint } from '../Fingerprint';
import { useT } from '../useT';

type Result =
  | { phase: 'idle' }
  | { phase: 'balance'; address: string; balance: number }
  | { phase: 'bad'; id: number }
  | { phase: 'failed'; detail: string };

const HEX64 = /^[0-9a-f]{64}$/;

// Any address's balance. Its fingerprint is built as the person types, a bar for each complete byte.
export function AddressLookup() {
  const words = useT().wallet.lookup;
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<Result>({ phase: 'idle' });
  const address = typed.trim().toLowerCase();
  const valid = HEX64.test(address);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) {
      // A new id replays the shake on every wrong try.
      setResult((current) => ({ phase: 'bad', id: current.phase === 'bad' ? current.id + 1 : 0 }));
      return;
    }
    try {
      setResult({ phase: 'balance', address, balance: await getBalance(address) });
    } catch (error) {
      setResult({ phase: 'failed', detail: detailOf(error, words.noAnswer) });
    }
  };

  return (
    <section aria-labelledby="look-h" className="min-w-0 flex-[1_1_340px] rounded-[28px] bg-vl-surface p-[26px] max-sm:p-5">
      <h2 id="look-h" className="text-[22px] font-bold tracking-[-0.02em]">
        {words.title}
      </h2>
      <form onSubmit={(event) => void submit(event)} className="mt-3.5 flex flex-col gap-2.5">
        <Fingerprint hex={address} bars={12} className="h-7 gap-[3px]" />
        <label htmlFor="other" className="text-sm font-medium">
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
          className={`h-[50px] rounded-[14px] border-[1.5px] bg-vl-surface px-3.5 font-vl-mono text-[13px] transition-colors duration-(--vl-dur-fast) ${
            valid ? 'border-vl-ok' : address ? 'border-vl-accent' : 'border-vl-line'
          }`}
        />
        <span className="font-vl-mono text-[13px] text-vl-muted">{address.length} / 64</span>
        <button type="submit" className="h-[50px] rounded-[14px] bg-vl-strong font-bold text-vl-on-strong">
          {words.show}
        </button>
      </form>
      <div aria-live="polite">
        {result.phase === 'balance' && (
          <div className="mt-3.5 animate-vl-fade-up rounded-[18px] bg-vl-bg p-4">
            <p className="text-sm text-vl-muted">{words.balanceOf(shortHash(result.address, 8))}</p>
            <p className="mt-0.5 text-[34px] font-extrabold tracking-[-0.03em]">{formatAmount(result.balance)} VL</p>
          </div>
        )}
        {result.phase === 'bad' && (
          <p key={result.id} className="mt-3.5 animate-vl-shake text-[15px] text-vl-danger">
            {words.invalid}
          </p>
        )}
        {result.phase === 'failed' && <p className="mt-3.5 text-[15px] text-vl-danger">{result.detail}</p>}
      </div>
    </section>
  );
}
