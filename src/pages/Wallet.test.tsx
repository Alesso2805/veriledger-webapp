import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { keyPairFromSecret } from '../lib/keys';
import { api } from '../services/api';
import { Wallet } from './Wallet';

vi.mock('../services/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

describe('Wallet', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockClear();
    vi.mocked(api.post).mockClear();
  });

  it('generates the key pair in the browser, without any request', () => {
    render(<Wallet />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate New Wallet' }));

    const [publicKey, privateKey] = screen.getAllByRole('textbox').map((input) => (input as HTMLInputElement).value);
    expect(privateKey).toMatch(/^[0-9a-f]{64}$/);
    expect(keyPairFromSecret(privateKey).public_key).toBe(publicKey);
    expect(api.post).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('says the private key was never sent and is not stored', () => {
    render(<Wallet />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate New Wallet' }));

    expect(screen.getByText(/never sent to the server and is not stored anywhere/)).toBeInTheDocument();
  });
});
