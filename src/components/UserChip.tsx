import { useEffect, useState } from 'react';
import { getMe } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import type { CurrentUser } from '../types/session';

export function UserChip() {
  const token = useAppStore((state) => state.token);
  const [user, setUser] = useState<CurrentUser | null>(null);

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
  }, [token]);

  if (!user) return null;

  return (
    <span className="hidden h-9 items-center gap-2 rounded-full border border-vl-line px-3 text-[13px] sm:flex">
      <span>{user.email}</span>
      <span className="font-vl-mono text-[11px] text-vl-accent">{user.role}</span>
    </span>
  );
}
