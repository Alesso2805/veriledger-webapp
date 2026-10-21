import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { isExpired } from '../lib/jwt';
import { useAppStore } from '../store/useAppStore';
import type { LoginRedirectState } from '../types/session';

// The stored token, unless its exp has passed; an expired token is cleared and remembered as expired.
function useSessionToken() {
  const token = useAppStore((state) => state.token);
  const expire = useAppStore((state) => state.expire);
  const expired = token !== null && isExpired(token);

  useEffect(() => {
    if (expired) expire();
  }, [expired, expire]);

  return { token: expired ? null : token, expired };
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, expired } = useSessionToken();
  const endedReason = useAppStore((state) => state.endedReason);
  const { pathname, search } = useLocation();
  if (!token) {
    const reason = expired ? 'expired' : (endedReason ?? undefined);
    const state: LoginRedirectState = { from: { pathname, search }, reason };
    return <Navigate to="/login" replace state={state} />;
  }
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useSessionToken();
  const from = (useLocation().state as LoginRedirectState | null)?.from;
  if (token) return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : '/'} replace />;
  return <>{children}</>;
}
