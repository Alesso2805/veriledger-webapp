import { useRoutes } from 'react-router';
import { HealthWatcher } from './components/HealthWatcher';
import { ToastRegion } from './components/ToastRegion';
import { routes } from './Router';

export function App() {
  return (
    <>
      <HealthWatcher />
      {useRoutes(routes)}
      <ToastRegion />
    </>
  );
}
