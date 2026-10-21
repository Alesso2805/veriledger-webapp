import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicRoute } from '../components/RouteGuards';
import { InvalidCredentialsError, login } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import type { LoginRedirectState } from '../types/session';
import { Login } from './Login';

vi.mock('../services/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/auth')>()),
  login: vi.fn(),
}));

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
    useAppStore.setState({ token: null });
    vi.mocked(login).mockReset();
  });

  it('starts with an empty form, never pre-filled', () => {
    renderLogin();

    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('explains that the session expired', () => {
    renderLogin({ reason: 'expired' });

    expect(screen.getByRole('status')).toHaveTextContent('Your session expired.');
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
