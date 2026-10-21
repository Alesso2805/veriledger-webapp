import { Outlet, type RouteObject } from 'react-router';
import { Layout } from './components/Layout';
import { OpenRoute, ProtectedRoute, PublicRoute } from './components/RouteGuards';
import { Login } from './pages/Login';
import { Tower } from './pages/Tower';
import { Wallet } from './pages/Wallet';
import { SignAndSend } from './pages/SignAndSend';
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
    element: <Layout />,
    children: [
      {
        // What the API lets anyone read (ADR-0005).
        element: (
          <OpenRoute>
            <Outlet />
          </OpenRoute>
        ),
        children: [
          { index: true, element: <Tower /> },
          { path: 'transaction/:hash', element: <TransactionDetail /> },
          { path: 'network', element: <Network /> },
          { path: '*', element: <NotFound /> },
        ],
      },
      {
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { path: 'wallet', element: <Wallet /> },
          { path: 'transact', element: <SignAndSend /> },
        ],
      },
    ],
  },
];
