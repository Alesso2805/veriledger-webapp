import { useEffect, useState } from 'react';
import { timeLeft } from '../lib/format';
import { getMe } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import { useSessionToken } from './useSessionToken';
import { useT } from './useT';

export function UserChip() {
  const t = useT();
  // Never an expired token: its 401 could arrive after the login and end the session a second time.
  const { token } = useSessionToken();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!token) return;
    let active = true;
    // A failed /auth/me leaves the chip out; an expired session is VLW-17's 401 handling.
    getMe().then(
      (me) => active && setUser(me),
      () => active && setUser(null),
    );
    return () => {
      active = false;
    };
  }, [token, setUser]);

  // A demo counts down once a minute, from now: the chip mounts with the page, often before the demo starts.
  // Each tick also reads the token again, so a demo that runs out while the page is open ends here and the
  // login says so, without waiting for a request to fail.
  const expiresAt = user?.expires_at ?? null;
  useEffect(() => {
    if (!expiresAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!user) return null;
  const left = expiresAt ? timeLeft(Date.parse(expiresAt) - now) : null;

  return (
    <span className="hidden h-9 animate-vl-fade-in items-center gap-2 rounded-full border border-vl-line px-3 text-[13px] sm:flex">
      <span>{user.display_name}</span>
      <span className="font-vl-mono text-[11px] text-vl-accent">
        {left ? t.shell.demoChip('hours' in left ? t.shell.hoursLeft(left.hours) : t.shell.minutesLeft(left.minutes)) : user.role}
      </span>
    </span>
  );
}
