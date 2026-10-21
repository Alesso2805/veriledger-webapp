import { Navigate } from 'react-router';
import { useAppStore } from '../store/useAppStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAppStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAppStore((state) => state.token);
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}
