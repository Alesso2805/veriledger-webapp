import { useEffect } from 'react';
import { getMe } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import { useSessionToken } from './useSessionToken';

export function UserChip() {
  // Never an expired token: its 401 could arrive after the login and end the session a second time.
  const { token } = useSessionToken();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

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

  if (!user) return null;

  return (
    <span className="hidden h-9 items-center gap-2 rounded-full border border-vl-line px-3 text-[13px] sm:flex">
      <span>{user.display_name}</span>
      <span className="font-vl-mono text-[11px] text-vl-accent">{user.role}</span>
    </span>
  );
}
