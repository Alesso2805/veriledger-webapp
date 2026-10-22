import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { AppFailed } from './components/AppFailed';

// The login stands for anything outside a page's own boundary that throws while drawing.
vi.mock('./pages/Login', () => ({
  Login: () => {
    throw new Error('drawing failed');
  },
}));
vi.mock('./components/checkHealth', () => ({ checkHealth: vi.fn(), HEALTH_POLL_MS: 10_000 }));

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('draws its own fallback, not a blank page, when the login throws while drawing (VLW-35)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'VeriLedger ran into a problem' })).toBeInTheDocument();
    expect(screen.getByText(/A reload forgets a key held in this tab/)).toBeInTheDocument();
    await expect(document.body).toPassAxe();
  });

  it('reloads the page from its fallback', () => {
    const reload = vi.fn();
    render(<AppFailed onReload={reload} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));

    expect(reload).toHaveBeenCalledOnce();
  });
});
