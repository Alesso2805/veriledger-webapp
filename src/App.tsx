import { useRoutes } from 'react-router';
import { ToastRegion } from './components/ToastRegion';
import { routes } from './Router';

export function App() {
  return (
    <>
      {useRoutes(routes)}
      <ToastRegion />
    </>
  );
}
