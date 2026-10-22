import { useRoutes } from 'react-router';
import { AppFailed } from './components/AppFailed';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HealthWatcher } from './components/HealthWatcher';
import { ToastRegion } from './components/ToastRegion';
import { useLanguageAttribute } from './components/useT';
import { useThemeAttribute } from './components/useThemeAttribute';
import { routes } from './Router';

// Inside the boundary, so a throw while matching a route is caught too.
function Pages() {
  return useRoutes(routes);
}

// Each page has its own boundary in the shell (Layout); this one catches what throws in the shell or the login.
export function App() {
  useThemeAttribute();
  useLanguageAttribute();
  return (
    <ErrorBoundary fallback={() => <AppFailed />}>
      <HealthWatcher />
      <Pages />
      <ToastRegion />
    </ErrorBoundary>
  );
}
