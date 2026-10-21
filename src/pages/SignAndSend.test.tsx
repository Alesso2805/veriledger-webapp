import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import vectors from '../lib/__fixtures__/signing-vectors.json';
import { getBalance } from '../services/wallets';
import { useKeyStore } from '../store/useKeyStore';
import { SignAndSend } from './SignAndSend';

vi.mock('../services/wallets', () => ({ getBalance: vi.fn(), getNextNonce: vi.fn() }));

// RFC 8032 test keys from the API's vectors: published, test-only.
const { public_key: publicKey, private_key: privateKey } = vectors.vectors[0];

function renderPage() {
  render(
    <MemoryRouter>
      <SignAndSend />
    </MemoryRouter>,
  );
}

function openKeyFile(text: string) {
  fireEvent.change(screen.getByLabelText('Open a key file'), {
    target: { files: [new File([text], 'key.json', { type: 'application/json' })] },
  });
}

describe('SignAndSend', () => {
  beforeEach(() => {
    useKeyStore.setState({ pair: null });
    vi.mocked(getBalance).mockResolvedValue(50.1);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('asks for a key when this tab holds none', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'No key in this tab' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a wallet' })).toHaveAttribute('href', '/wallet');
  });

  it('opens a key file and signs as its address, with its balance', async () => {
    renderPage();

    openKeyFile(JSON.stringify({ public_key: publicKey, private_key: privateKey }));

    expect(await screen.findByText('Signing as')).toBeInTheDocument();
    expect(screen.getByTitle(publicKey)).toHaveTextContent('d75a9801…f707511a');
    expect(await screen.findByText('50.10 VL')).toBeInTheDocument();
    expect(useKeyStore.getState().pair).toEqual({ public_key: publicKey, private_key: privateKey });
    expect(getBalance).toHaveBeenCalledWith(publicKey);
  });

  it('says what is wrong with a file that is not a key file', async () => {
    renderPage();

    openKeyFile('{"public_key": "ab"}');

    expect(await screen.findByRole('alert')).toHaveTextContent('This file has no private_key of 64 hex characters.');
    expect(useKeyStore.getState().pair).toBeNull();
  });

  it('signs as the key a wallet left in this tab', async () => {
    useKeyStore.setState({ pair: { public_key: publicKey, private_key: privateKey } });
    renderPage();

    expect(screen.queryByRole('heading', { name: 'No key in this tab' })).not.toBeInTheDocument();
    expect(await screen.findByText('50.10 VL')).toBeInTheDocument();
  });
});
