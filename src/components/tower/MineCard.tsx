import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import type { LoginRedirectState, UserRole } from '../../types/session';

interface Props {
  // The number the next block will get; null until the chain has loaded.
  next: number | null;
  waiting: number | null;
  // Anyone can look at the tower; mining needs a session (ADR-0005). A node in demo mode offers a demo account
  // in place, which signs the visitor in without leaving the tower (VLW-34); otherwise the login.
  signedIn: boolean;
  demoMode: boolean;
  startingDemo: boolean;
  onTryDemo: () => void;
  // null until /auth/me answers; the API has the last word on roles (VLA-19).
  role: UserRole | null;
  offline: boolean;
  // Offline because the API's database does not answer, while the API does (VLA-26).
  databaseDown: boolean;
  mining: boolean;
  onMine: (minerAddress: string) => void;
}

export function MineCard({
  next,
  waiting,
  signedIn,
  demoMode,
  startingDemo,
  onTryDemo,
  role,
  offline,
  databaseDown,
  mining,
  onMine,
}: Props) {
  const [address, setAddress] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const { pathname, search } = useLocation();

  // The API answers only when the block is sealed, so the elapsed time is the only progress there is to show.
  useEffect(() => {
    if (!mining) return;
    const started = performance.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(performance.now() - started), 100);
    return () => clearInterval(timer);
  }, [mining]);

  const allowed = signedIn && (role === null || role === 'admin' || role === 'trader');
  const ready = next !== null && allowed && !offline && !mining && address.trim() !== '';

  let note: ReactNode = '';
  if (mining) {
    // The seconds are hidden from screen readers, which would otherwise read them ten times a second.
    note = (
      <>
        Mining… <span aria-hidden="true">{(elapsed / 1000).toFixed(1)} s.</span> The node answers when it finds a hash
        that starts with 0000.
      </>
    );
  } else if (!signedIn) {
    note = demoMode ? 'Anyone can look. To mine, start a demo: one click, no email.' : 'Anyone can look. To mine, sign in.';
  } else if (!allowed) {
    note = 'Mining needs the trader or admin role.';
  } else if (offline) {
    note = databaseDown
      ? 'Mining is unavailable while the API’s database does not answer.'
      : 'Mining is unavailable while the API is unreachable.';
  } else if (next === 0) {
    note = 'The first block you mine becomes the genesis block.';
  } else if (next !== null && waiting === 0) {
    note = 'Nothing waiting: the next block will hold only the reward.';
  } else if (next !== null && waiting !== null) {
    note = `${waiting} ${waiting === 1 ? 'transaction' : 'transactions'} will go into block #${next}.`;
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) onMine(address.trim());
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 border-t border-vl-line pt-3.5">
      <label htmlFor="miner" className="text-[13px] font-medium">
        Reward address
      </label>
      <input
        id="miner"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        className="h-10 rounded-[10px] border border-vl-line bg-vl-bg px-2.5 font-vl-mono text-[11px] text-vl-text"
      />
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span aria-live="polite" className={`flex-[1_1_200px] text-[13px] text-vl-muted ${mining ? 'animate-vl-pulse' : ''}`}>
          {note}
        </span>
        {signedIn ? (
          <button
            type="submit"
            disabled={!ready}
            className={`h-11 rounded-[10px] px-[18px] font-semibold transition-colors duration-(--vl-dur-base) ${
              ready ? 'bg-vl-accent text-vl-on-accent' : 'bg-vl-line text-vl-muted'
            }`}
          >
            {mining ? 'Mining…' : next === 0 ? 'Mine the genesis block' : `Mine block${next === null ? '' : ` #${next}`}`}
          </button>
        ) : demoMode ? (
          <button
            type="button"
            onClick={onTryDemo}
            disabled={startingDemo}
            className="h-11 rounded-[10px] bg-vl-accent px-[18px] font-semibold text-vl-on-accent"
          >
            {startingDemo ? 'Starting a demo…' : 'Try the demo to mine'}
          </button>
        ) : (
          <Link
            to="/login"
            state={{ from: { pathname, search } } satisfies LoginRedirectState}
            className="inline-flex h-11 items-center rounded-[10px] bg-vl-accent px-[18px] font-semibold text-vl-on-accent"
          >
            Sign in to mine
          </Link>
        )}
      </div>
    </form>
  );
}
