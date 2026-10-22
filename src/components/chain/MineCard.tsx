import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { useKeyStore } from '../../store/useKeyStore';
import type { LoginRedirectState, UserRole } from '../../types/session';
import { useT } from '../useT';

interface Props {
  // The number the next block will get; null until the chain has loaded.
  next: number | null;
  waiting: number | null;
  // Anyone can look at the chain; mining needs a session (ADR-0005). A node in demo mode offers a demo account
  // in place, which signs the visitor in without leaving the page; otherwise the login.
  signedIn: boolean;
  demoMode: boolean;
  startingDemo: boolean;
  onTryDemo: () => void;
  // null until /auth/me answers; the API has the last word on roles.
  role: UserRole | null;
  offline: boolean;
  // Offline because the API's database does not answer, while the API does.
  databaseDown: boolean;
  mining: boolean;
  // The elapsed time while mining, measured in the browser: the API answers only when the block is sealed.
  seconds: string;
  onMine: (minerAddress: string) => void;
}

export function MineCard({ next, waiting, signedIn, demoMode, startingDemo, onTryDemo, role, offline, databaseDown, mining, seconds, onMine }: Props) {
  const words = useT().chain.mine;
  // The key this tab signs with, if any, is the likely reward address; it can be changed.
  const [address, setAddress] = useState(() => useKeyStore.getState().pair?.public_key ?? '');
  const { pathname, search } = useLocation();

  const allowed = signedIn && (role === null || role === 'admin' || role === 'trader');
  const ready = next !== null && allowed && !offline && !mining && address.trim() !== '';

  let note: ReactNode = '';
  if (mining) {
    // The seconds are hidden from screen readers, which would otherwise read them ten times a second.
    note = (
      <>
        {words.mining} <span aria-hidden="true">{seconds} s.</span> {words.explain}
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

  const live = 'h-[52px] rounded-[14px] px-[18px] text-base font-bold transition-colors duration-(--vl-dur-base)';

  return (
    <form onSubmit={submit} aria-labelledby="mine-h" className="flex flex-col gap-2.5 rounded-3xl bg-vl-surface p-[22px]">
      <h2 id="mine-h" className="text-[22px] font-bold tracking-[-0.02em]">
        {words.title}
      </h2>
      <label htmlFor="miner" className="text-sm font-medium">
        {words.address}
      </label>
      <input
        id="miner"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        className="h-[46px] rounded-xl border-[1.5px] border-vl-line bg-vl-surface px-3 font-vl-mono text-[11px] text-vl-text"
      />
      <p aria-live="polite" className={`text-sm text-vl-muted ${mining ? 'animate-vl-pulse' : ''}`}>
        {note}
      </p>
      {signedIn ? (
        <button
          type="submit"
          disabled={!ready}
          className={`${live} ${ready ? 'bg-vl-accent text-vl-on-accent' : 'bg-vl-skeleton text-vl-muted'}`}
        >
          {mining ? words.mining : next === 0 ? words.mineGenesis : words.mineBlock(next)}
        </button>
      ) : demoMode ? (
        <button
          type="button"
          onClick={onTryDemo}
          disabled={startingDemo}
          className={`${live} bg-vl-accent text-vl-on-accent ${startingDemo ? 'animate-vl-pulse' : ''}`}
        >
          {startingDemo ? words.startingDemo : words.tryDemo}
        </button>
      ) : (
        <Link
          to="/login"
          state={{ from: { pathname, search } } satisfies LoginRedirectState}
          className={`${live} inline-flex items-center justify-center bg-vl-accent text-vl-on-accent`}
        >
          {words.signIn}
        </Link>
      )}
    </form>
  );
}
