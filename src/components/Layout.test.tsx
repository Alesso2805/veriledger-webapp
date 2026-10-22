import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMe, startDemo } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import { useHealthStore } from '../store/useHealthStore';
import { useKeyStore } from '../store/useKeyStore';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { useToastStore } from '../store/useToastStore';
import type { LoginRedirectState } from '../types/session';
import { Layout } from './Layout';
import { useLanguageAttribute } from './useT';

vi.mock('../services/auth', () => ({ getMe: vi.fn(), startDemo: vi.fn() }));

const ME = { id: '1', email: 'trader@veriledger.test', display_name: 'trader@veriledger.test', expires_at: null, role: 'trader' as const, created_at: '', updated_at: '' };

const apiStatus = (text: string) => waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(text));

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>;
}

function LoginProbe() {
  const from = (useLocation().state as LoginRedirectState | null)?.from;
  return <p>login page, back to {from ? `${from.pathname}${from.search ?? ''}` : 'nowhere'}</p>;
}

function Broken(): never {
  throw new Error('drawing failed');
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
          <Route path="/broken" element={<Broken />} />
        </Route>
      </Routes>
      <CurrentPath />
    </MemoryRouter>,
  );
}

describe('Layout (the shell)', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ language: 'en', theme: 'system' });
    useAppStore.setState({ token: 'abc.def.ghi' });
    useHealthStore.setState({ online: true, demoMode: false });
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

  it('shows a demo account as its guest name, "demo" and the hours it has left', async () => {
    const expires = new Date(Date.now() + 23.5 * 3_600_000).toISOString();
    vi.mocked(getMe).mockResolvedValue({ ...ME, email: null, display_name: 'Guest 4F2A', expires_at: expires });
    renderShell('/');

    expect(await screen.findByText('Guest 4F2A')).toBeInTheDocument();
    expect(screen.getByText('demo · 23 h left')).toBeInTheDocument();
    expect(screen.queryByText('trader')).not.toBeInTheDocument();
  });

  it('counts a demo down from when it starts, not from when the page opened', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      useAppStore.setState({ token: null, user: null });
      renderShell('/');
      await apiStatus('api · online');
      // The visitor looks around for half an hour before starting the demo (found in the browser).
      vi.setSystemTime(Date.now() + 30 * 60_000);
      const expires = new Date(Date.now() + 24 * 3_600_000 - 1_000).toISOString();
      vi.mocked(getMe).mockResolvedValue({ ...ME, email: null, display_name: 'Guest 4F2A', expires_at: expires });

      act(() => useAppStore.getState().setToken('demo.jwt.token'));

      expect(await screen.findByText('demo · 23 h left')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('starts a demo from the header without leaving the page', async () => {
    useAppStore.setState({ token: null, user: null });
    useHealthStore.setState({ online: true, demoMode: true });
    vi.mocked(startDemo).mockResolvedValue('demo.jwt.token');
    renderShell('/transaction/abc');

    fireEvent.click(screen.getByRole('button', { name: 'Try the demo' }));

    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(useAppStore.getState().token).toBe('demo.jwt.token');
    expect(screen.getByTestId('path')).toHaveTextContent(/^\/transaction\/abc$/);
  });

  it("says in a toast why the API refused a demo, in the API's words", async () => {
    useAppStore.setState({ token: null, user: null });
    useHealthStore.setState({ online: true, demoMode: true });
    useToastStore.setState({ toasts: [] });
    vi.mocked(startDemo).mockRejectedValue(new Error('The demo is full right now; try again later'));
    renderShell('/');

    fireEvent.click(screen.getByRole('button', { name: 'Try the demo' }));

    await waitFor(() =>
      expect(useToastStore.getState().toasts.map(({ text, kind }) => ({ text, kind }))).toEqual([
        { text: 'The demo is full right now; try again later', kind: 'err' },
      ]),
    );
    expect(screen.getByRole('button', { name: 'Try the demo' })).toBeEnabled();
  });

  it('offers no demo on a node without demo mode', async () => {
    useAppStore.setState({ token: null, user: null });
    useHealthStore.setState({ online: true, demoMode: false });
    renderShell('/');
    await apiStatus('api · online');

    expect(screen.queryByRole('button', { name: 'Try the demo' })).not.toBeInTheDocument();
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

  it('keeps the shell when a page throws while drawing, and leaves that page for the tower (VLW-35)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderShell('/broken');

    expect(await screen.findByRole('heading', { level: 1, name: 'This page ran into a problem' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    await apiStatus('api · online');
    await expect(document.body).toPassAxe();

    fireEvent.click(screen.getByRole('link', { name: 'Back to the tower' }));

    expect(await screen.findByText('tower page')).toBeInTheDocument();
    expect(screen.queryByText('This page ran into a problem')).not.toBeInTheDocument();
    vi.mocked(console.error).mockRestore();
  });

  it('offers only "Try again" when the page that failed is the tower', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Broken />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'This page ran into a problem' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Back to the tower' })).not.toBeInTheDocument();
    await apiStatus('api · online');
    vi.mocked(console.error).mockRestore();
  });

  it('speaks Spanish after the language switch, on <html> too, and English again', async () => {
    function LanguageProbe() {
      useLanguageAttribute();
      return null;
    }
    render(<LanguageProbe />);
    renderShell('/wallet');
    await apiStatus('api · online');

    fireEvent.click(screen.getByRole('button', { name: 'EN, English. Switch to español' }));
    expect(screen.getByRole('link', { name: 'Billetera' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Torre' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tema: Sistema. Cambiar a Claro' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('en línea');
    expect(screen.getByPlaceholderText('Número de bloque o hash')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');

    fireEvent.click(screen.getByRole('button', { name: 'ES, español. Cambiar a English' }));
    expect(screen.getByRole('link', { name: 'Wallet' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});
