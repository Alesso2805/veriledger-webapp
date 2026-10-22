import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { formatSeconds } from '../../lib/format';
import type { LoginRedirectState, UserRole } from '../../types/session';
import { useLanguage, useT } from '../useT';

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
  const t = useT();
  const words = t.chain.mine;
  const language = useLanguage();
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
        {words.mining} <span aria-hidden="true">{formatSeconds(elapsed, language)} s.</span> {words.explain}
      </>
    );
  } else if (!signedIn) {
    note = demoMode ? words.visitorDemo : words.visitor;
  } else if (!allowed) {
    note = words.role;
  } else if (offline) {
    note = databaseDown ? words.noDatabase : words.offline;
  } else if (next === 0) {
    note = words.genesis;
  } else if (next !== null && waiting === 0) {
    note = words.onlyReward;
  } else if (next !== null && waiting !== null) {
    note = words.willGo(waiting, next);
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) onMine(address.trim());
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 border-t border-vl-line pt-3.5">
      <label htmlFor="miner" className="text-[13px] font-medium">
        {words.address}
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
            {mining ? words.mining : next === 0 ? words.mineGenesis : words.mineBlock(next)}
          </button>
        ) : demoMode ? (
          <button
            type="button"
            onClick={onTryDemo}
            disabled={startingDemo}
            className="h-11 rounded-[10px] bg-vl-accent px-[18px] font-semibold text-vl-on-accent"
          >
            {startingDemo ? words.startingDemo : words.tryDemo}
          </button>
        ) : (
          <Link
            to="/login"
            state={{ from: { pathname, search } } satisfies LoginRedirectState}
            className="inline-flex h-11 items-center rounded-[10px] bg-vl-accent px-[18px] font-semibold text-vl-on-accent"
          >
            {words.signIn}
          </Link>
        )}
      </div>
    </form>
  );
}
