import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMe } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import { useHealthStore } from '../store/useHealthStore';
import { useKeyStore } from '../store/useKeyStore';
import type { LoginRedirectState } from '../types/session';
import { Layout } from './Layout';

vi.mock('../services/auth', () => ({ getMe: vi.fn() }));

const ME = { id: '1', email: 'trader@veriledger.test', display_name: 'trader@veriledger.test', expires_at: null, role: 'trader' as const, created_at: '', updated_at: '' };

const apiStatus = (text: string) => waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(text));

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>;
}

function LoginProbe() {
  const from = (useLocation().state as LoginRedirectState | null)?.from;
  return <p>login page, back to {from ? `${from.pathname}${from.search ?? ''}` : 'nowhere'}</p>;
}

function renderShell(path = '/wallet') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route element={<Layout />}>
          <Route path="/" element={<p>tower page</p>} />
          <Route path="/wallet" element={<p>wallet page</p>} />
          <Route path="/transaction/:hash" element={<p>transaction page</p>} />
        </Route>
      </Routes>
      <CurrentPath />
    </MemoryRouter>,
  );
}

describe('Layout (the shell)', () => {
  beforeEach(() => {
    useAppStore.setState({ token: 'abc.def.ghi' });
    useHealthStore.setState({ online: true });
    vi.mocked(getMe).mockResolvedValue(ME);
  });

  it('marks the tab of the current page', async () => {
    renderShell('/wallet');

    expect(screen.getByRole('link', { name: 'Wallet' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tower' })).not.toHaveAttribute('aria-current');
    await apiStatus('api · online');
  });

  it('shows the API as online when /health answers', async () => {
    renderShell();

    await apiStatus('api · online');
  });

  it('shows the API as offline when /health fails', async () => {
    useHealthStore.setState({ online: false });
    renderShell();

    await apiStatus('api · offline');
  });

  it('shows the email and role from /auth/me', async () => {
    renderShell();

    expect(await screen.findByText('trader@veriledger.test')).toBeInTheDocument();
    expect(screen.getByText('trader')).toBeInTheDocument();
    // Kept in the store, so that pages apply role rules without asking /auth/me again.
    expect(useAppStore.getState().user).toEqual(ME);
  });

  it('signs out: clears the session, forgets the key this tab held, and opens /login', async () => {
    useKeyStore.setState({ pair: { public_key: 'ab'.repeat(32), private_key: 'cd'.repeat(32) } });
    renderShell();
    await apiStatus('api · online');

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(useAppStore.getState().token).toBeNull();
    expect(useKeyStore.getState().pair).toBeNull();
    expect(screen.getByTestId('path')).toHaveTextContent(/^\/login$/);
  });

  it('offers a visitor "Sign in", which comes back to the same page', async () => {
    useAppStore.setState({ token: null, user: null });
    vi.mocked(getMe).mockClear();
    renderShell('/transaction/abc?from=search');
    await apiStatus('api · online');

    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(getMe).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('link', { name: 'Sign in' }));

    expect(screen.getByText('login page, back to /transaction/abc?from=search')).toBeInTheDocument();
  });

  it('has the search for blocks and transactions in its header', async () => {
    renderShell();
    await apiStatus('api · online');

    // How it searches is HeaderSearch.test.tsx's concern.
    expect(screen.getByRole('searchbox', { name: 'Search a block number or a hash' })).toBeInTheDocument();
  });

  it('offers a skip link to the main content', async () => {
    renderShell();
    await apiStatus('api · online');

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });
});
