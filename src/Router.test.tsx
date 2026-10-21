import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { useAppStore } from './store/useAppStore';

// The pages fetch on mount; these tests only follow redirects, so requests stay pending instead of leaving.
vi.mock('./services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/api')>()),
  api: {
    get: () => new Promise(() => {}),
    post: () => new Promise(() => {}),
  },
}));

function CurrentPath() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function visit(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <CurrentPath />
    </MemoryRouter>,
  );
  return screen.getByTestId('path');
}

describe('routes', () => {
  beforeEach(() => {
    useAppStore.setState({ token: null, endedReason: null });
  });

  it('sends a visitor without a session from a protected page to /login', async () => {
    const path = visit('/wallet');

    await waitFor(() => expect(path).toHaveTextContent(/^\/login$/));
  });

  it('opens a protected page for a signed-in user', async () => {
    useAppStore.setState({ token: 'abc.def.ghi' });
    const path = visit('/wallet');

    await waitFor(() => expect(path).toHaveTextContent(/^\/wallet$/));
  });

  it('drops a stored token whose exp has passed, and says the session expired', async () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 })).replace(/=+$/, '');
    useAppStore.setState({ token: `header.${payload}.signature` });
    const path = visit('/wallet');

    await waitFor(() => expect(path).toHaveTextContent(/^\/login$/));
    expect(screen.getByText(/Your session expired/)).toBeInTheDocument();
    expect(useAppStore.getState().token).toBeNull();
  });

  it('takes the person to the login when the API ends the session mid-visit', async () => {
    useAppStore.setState({ token: 'abc.def.ghi' });
    const path = visit('/wallet');
    await waitFor(() => expect(path).toHaveTextContent(/^\/wallet$/));

    act(() => useAppStore.getState().expire());

    await waitFor(() => expect(path).toHaveTextContent(/^\/login$/));
    expect(screen.getByText(/Your session expired/)).toBeInTheDocument();
  });

  it('returns to the protected page after signing in', async () => {
    const path = visit('/wallet');
    await waitFor(() => expect(path).toHaveTextContent(/^\/login$/));

    act(() => useAppStore.setState({ token: 'abc.def.ghi' }));

    await waitFor(() => expect(path).toHaveTextContent(/^\/wallet$/));
  });

  it('shows the 404 tower for an unknown address, inside the shell', async () => {
    useAppStore.setState({ token: 'abc.def.ghi' });
    visit('/no/such/page');

    expect(await screen.findByRole('heading', { name: 'This page is not in the tower' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the tower' })).toHaveAttribute('href', '/');
  });

  it('shows a visitor the 404 tower too, with "Sign in" in the header', async () => {
    const path = visit('/no/such/page');

    expect(await screen.findByRole('heading', { name: 'This page is not in the tower' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(path).toHaveTextContent(/^\/no\/such\/page$/);
  });

  it('opens the tower for a visitor, without asking who they are', async () => {
    const path = visit('/');

    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(path).toHaveTextContent(/^\/$/);
  });

  it('drops an expired token on an open page too, and says the session expired', async () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 })).replace(/=+$/, '');
    useAppStore.setState({ token: `header.${payload}.signature` });
    const path = visit('/network');

    await waitFor(() => expect(path).toHaveTextContent(/^\/login$/));
    expect(screen.getByText(/Your session expired/)).toBeInTheDocument();
  });

  it('takes the person to the login when the API ends the session on an open page', async () => {
    useAppStore.setState({ token: 'abc.def.ghi' });
    const path = visit('/');
    await screen.findByRole('button', { name: 'Sign out' });

    act(() => useAppStore.getState().expire());

    await waitFor(() => expect(path).toHaveTextContent(/^\/login$/));
    expect(screen.getByText(/Your session expired/)).toBeInTheDocument();
  });

  it('lets a visitor back to the open pages once the login has said the session expired', async () => {
    act(() => useAppStore.getState().expire());
    const path = visit('/');
    await waitFor(() => expect(path).toHaveTextContent(/^\/login$/));

    // The notice lives in the login's router state; the store forgets it, so going back does not bounce again.
    expect(useAppStore.getState().endedReason).toBeNull();
  });

  it('sends a signed-in user away from /login to /', async () => {
    useAppStore.setState({ token: 'abc.def.ghi' });
    const path = visit('/login');

    await waitFor(() => expect(path).toHaveTextContent(/^\/$/));
  });
});
