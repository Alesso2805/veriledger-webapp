import { useRoutes } from 'react-router';
import { routes } from './Router';

export function App() {
  return useRoutes(routes);
}
