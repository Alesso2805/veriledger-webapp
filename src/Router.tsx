import type { RouteObject } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';
import { Login } from './pages/Login';
import { Explorer } from './pages/Explorer';
import { Wallet } from './pages/Wallet';
import { Transaction } from './pages/Transaction';
import { TransactionDetail } from './pages/TransactionDetail';
import { Network } from './pages/Network';
import { NotFound } from './pages/NotFound';

// The route table is data so that AR-08 can walk every route (src/architecture/protected-routes.test.tsx).
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Explorer /> },
      { path: 'transaction/:hash', element: <TransactionDetail /> },
      { path: 'wallet', element: <Wallet /> },
      { path: 'transact', element: <Transaction /> },
      { path: 'network', element: <Network /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
