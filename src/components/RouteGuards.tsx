import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAppStore } from '../store/useAppStore';
import type { LoginRedirectState } from '../types/session';
import { useSessionToken } from './useSessionToken';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, ended } = useSessionToken();
  const endedReason = useAppStore((state) => state.endedReason);
  const { pathname, search } = useLocation();
  if (!token) {
    const state: LoginRedirectState = { from: { pathname, search }, reason: ended ?? endedReason ?? undefined };
    return <Navigate to="/login" replace state={state} />;
  }
  return <>{children}</>;
}

// A page anyone can read (ADR-0005). A visitor who never signed in stays; a session that ends here still goes to
// the login, which says why (VLW-17, VLW-34).
export function OpenRoute({ children }: { children: React.ReactNode }) {
  const { ended } = useSessionToken();
  const endedReason = useAppStore((state) => state.endedReason);
  const { pathname, search } = useLocation();
  const reason = ended ?? endedReason;
  if (reason) {
    const state: LoginRedirectState = { from: { pathname, search }, reason };
    return <Navigate to="/login" replace state={state} />;
  }
  return <>{children}</>;
}

// Only without a session: the login.
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useSessionToken();
  const clearEndedReason = useAppStore((state) => state.clearEndedReason);
  const from = (useLocation().state as LoginRedirectState | null)?.from;

  // The login has the reason in its router state; keeping it in the store would send a visitor who goes back to
  // an open page straight to the login again.
  useEffect(() => {
    clearEndedReason();
  }, [clearEndedReason]);

  if (token) return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : '/'} replace />;
  return <>{children}</>;
}
