import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from './Router';
import { useAppStore } from './store/useAppStore';

// The pages fetch on mount; these tests only follow redirects, so requests stay pending instead of leaving.
vi.mock('./services/api', () => ({
  api: {
    get: () => new Promise(() => {}),
    post: () => new Promise(() => {}),
  },
}));

function CurrentPath() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
      <CurrentPath />
    </MemoryRouter>,
  );
  return screen.getByTestId('path');
}

describe('AppRouter', () => {
  beforeEach(() => {
    useAppStore.setState({ token: null });
  });

  it('sends a visitor without a session from a protected page to /login', () => {
    expect(renderAt('/wallet')).toHaveTextContent(/^\/login$/);
  });

  it('opens a protected page for a signed-in user', () => {
    useAppStore.setState({ token: 'abc.def.ghi' });

    expect(renderAt('/wallet')).toHaveTextContent(/^\/wallet$/);
  });

  it('sends a signed-in user away from /login to /', () => {
    useAppStore.setState({ token: 'abc.def.ghi' });

    expect(renderAt('/login')).toHaveTextContent(/^\/$/);
  });
});
