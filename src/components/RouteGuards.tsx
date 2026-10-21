import { Navigate, useLocation } from 'react-router';
import { useAppStore } from '../store/useAppStore';
import type { LoginRedirectState } from '../types/session';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAppStore((state) => state.token);
  const { pathname, search } = useLocation();
  if (!token) {
    const state: LoginRedirectState = { from: { pathname, search } };
    return <Navigate to="/login" replace state={state} />;
  }
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAppStore((state) => state.token);
  const from = (useLocation().state as LoginRedirectState | null)?.from;
  if (token) return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : '/'} replace />;
  return <>{children}</>;
}
