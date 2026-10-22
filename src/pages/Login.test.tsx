import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicRoute } from '../components/RouteGuards';
import { InvalidCredentialsError, login, startDemo } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import { useHealthStore } from '../store/useHealthStore';
import { usePreferencesStore } from '../store/usePreferencesStore';
import type { LoginRedirectState } from '../types/session';
import { Login } from './Login';

vi.mock('../services/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/auth')>()),
  login: vi.fn(),
  startDemo: vi.fn(),
}));

// The API's 429 detail, as detailOf passes it on (its own tests cover reading it from the response).
const tooMany = () => new Error('Too many demo accounts from your network in the last hour; try again later');

function renderLogin(state?: LoginRedirectState) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/" element={<p>tower page</p>} />
        <Route path="/wallet" element={<p>wallet page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function signIn() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'trader@veriledger.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'a password' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);
}

describe('Login', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ language: 'en' });
    useAppStore.setState({ token: null });
    useHealthStore.setState({ demoMode: false });
    vi.mocked(login).mockReset();
    vi.mocked(startDemo).mockReset();
  });

  it('speaks Spanish when that is the language', () => {
    usePreferencesStore.setState({ language: 'es' });
    useHealthStore.setState({ demoMode: true });
    renderLogin({ reason: 'expired' });

    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByText('Tu sesión expiró. Inicia sesión de nuevo para seguir donde estabas.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Probar la demo · sin cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar la cadena sin cuenta →' })).toHaveAttribute('href', '/');
  });

  it('starts a demo with one click and returns to the page the visitor was on', async () => {
    useHealthStore.setState({ demoMode: true });
    let created: (token: string) => void = () => {};
    vi.mocked(startDemo).mockReturnValue(new Promise((resolve) => (created = resolve)));
    renderLogin({ from: { pathname: '/wallet' } });

    fireEvent.click(screen.getByRole('button', { name: 'Try the demo · no account needed' }));

    expect(screen.getByRole('button', { name: 'Creating a demo account…' })).toBeDisabled();
    await act(async () => created('demo.jwt.token'));
    expect(await screen.findByText('wallet page')).toBeInTheDocument();
    expect(useAppStore.getState().token).toBe('demo.jwt.token');
  });

  it("shows the API's words when it refuses a demo, and shakes them", async () => {
    useHealthStore.setState({ demoMode: true });
    vi.mocked(startDemo).mockRejectedValue(tooMany());
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Try the demo · no account needed' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Too many demo accounts from your network in the last hour; try again later');
    expect(alert).toHaveClass('animate-vl-shake');
    expect(useAppStore.getState().token).toBeNull();
  });

  it('offers no demo on a node without demo mode, but still the chain', () => {
    renderLogin();

    expect(screen.queryByRole('heading', { name: 'Just looking around?' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse the chain without an account →' })).toHaveAttribute('href', '/');
  });

  it('starts with an empty form, never pre-filled', () => {
    renderLogin();

    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('shows which API it signs in to and whether it answers', () => {
    useHealthStore.setState({ online: true });
    renderLogin();

    expect(screen.getByText('127.0.0.1:8000 · online')).toBeInTheDocument();
  });

  it('explains that the session expired', () => {
    renderLogin({ reason: 'expired' });

    expect(screen.getByRole('status')).toHaveTextContent('Your session expired.');
  });

  it('explains that a demo ended, and that what it recorded stays on the chain', () => {
    renderLogin({ reason: 'demo-ended' });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Your demo ended after 24 h. Start a new demo or sign in. What it recorded is still on the chain.',
    );
  });

  it('returns to the page the person was on', async () => {
    vi.mocked(login).mockResolvedValue('abc.def.ghi');
    renderLogin({ from: { pathname: '/wallet' } });

    signIn();

    expect(await screen.findByText('wallet page')).toBeInTheDocument();
    expect(useAppStore.getState().token).toBe('abc.def.ghi');
    expect(login).toHaveBeenCalledWith('trader@veriledger.test', 'a password');
  });

  it('opens the tower when there is no page to return to', async () => {
    vi.mocked(login).mockResolvedValue('abc.def.ghi');
    renderLogin();

    signIn();

    expect(await screen.findByText('tower page')).toBeInTheDocument();
  });

  it('shakes the form and explains a 401', async () => {
    vi.mocked(login).mockRejectedValue(new InvalidCredentialsError('Invalid credentials'));
    renderLogin();

    signIn();

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials.');
    expect(screen.getByRole('button', { name: 'Sign in' }).closest('form')).toHaveClass('animate-vl-shake');
    expect(screen.getByLabelText('Email')).toHaveClass('border-vl-danger');
    await expect(document.body).toPassAxe();
  });

  it('clears the error once the person edits a field', async () => {
    vi.mocked(login).mockRejectedValue(new InvalidCredentialsError('Invalid credentials'));
    renderLogin();
    signIn();
    await screen.findByRole('alert');

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'another password' } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveClass('border-vl-line');
  });

  it('says when the API does not answer, without shaking', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Network Error'));
    renderLogin();

    signIn();

    expect(await screen.findByRole('alert')).toHaveTextContent('The API did not answer.');
    expect(screen.getByRole('button', { name: 'Sign in' }).closest('form')).not.toHaveClass('animate-vl-shake');
  });
});
