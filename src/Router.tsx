import { Routes, Route, Navigate } from 'react-router';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Explorer } from './pages/Explorer';
import { Wallet } from './pages/Wallet';
import { Transaction } from './pages/Transaction';
import { TransactionDetail } from './pages/TransactionDetail';
import { Network } from './pages/Network';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAppStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAppStore((state) => state.token);
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Explorer />} />
        <Route path="transaction/:hash" element={<TransactionDetail />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="transact" element={<Transaction />} />
        <Route path="network" element={<Network />} />
      </Route>
    </Routes>
  );
}
