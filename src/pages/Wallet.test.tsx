import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import vectors from '../lib/__fixtures__/signing-vectors.json';
import { keyFileText } from '../lib/keyFile';
import { keyPairFromSecret } from '../lib/keys';
import { getBalance } from '../services/wallets';
import { useKeyStore } from '../store/useKeyStore';
import { Wallet } from './Wallet';

vi.mock('../services/wallets', () => ({ getBalance: vi.fn() }));

// RFC 8032 test keys from the API's vectors: published, test-only.
const { public_key: publicKey, private_key: privateKey } = vectors.vectors[0];

function renderWallet() {
  render(
    <MemoryRouter>
      <Wallet />
    </MemoryRouter>,
  );
}

describe('Wallet', () => {
  beforeEach(() => {
    useKeyStore.setState({ pair: null, saved: false });
    vi.mocked(getBalance).mockResolvedValue(0);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates a key pair in the browser, holds it in the tab and asks to save it', async () => {
    renderWallet();

    fireEvent.click(screen.getByRole('button', { name: 'Create a wallet' }));

    const { pair, saved } = useKeyStore.getState();
    expect(pair?.private_key).toMatch(/^[0-9a-f]{64}$/);
    expect(keyPairFromSecret(pair!.private_key).public_key).toBe(pair!.public_key);
    expect(saved).toBe(false);
    expect(screen.getByRole('heading', { name: 'Save your key now' })).toBeInTheDocument();
    expect(screen.getByText(pair!.public_key.slice(0, 8))).toBeInTheDocument();
    expect(await screen.findByText('0.00')).toBeInTheDocument();
    expect(getBalance).toHaveBeenCalledWith(pair!.public_key);
  });

  it('downloads the key file, then takes the person’s word that it is stored', async () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:key');
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderWallet();
    fireEvent.click(screen.getByRole('button', { name: 'Create a wallet' }));
    const checkbox = screen.getByLabelText('2 · I stored it somewhere safe');
    expect(checkbox).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Download .json' }));

    expect(click).toHaveBeenCalled();
    expect(await createObjectURL.mock.calls[0][0].text()).toBe(keyFileText(useKeyStore.getState().pair!));
    expect(screen.getByText('Saved')).toBeInTheDocument();
    fireEvent.click(checkbox);
    expect(useKeyStore.getState().saved).toBe(true);
    expect(screen.getByRole('heading', { name: 'Your key is saved' })).toBeInTheDocument();
    click.mockRestore();
  });

  it('opens a key file as a key that is already saved', async () => {
    renderWallet();

    fireEvent.change(screen.getByLabelText('Choose a key file'), {
      target: { files: [new File([JSON.stringify({ public_key: publicKey, private_key: privateKey })], 'key.json')] },
    });

    expect(await screen.findByRole('heading', { name: 'Your key is saved' })).toBeInTheDocument();
    expect(useKeyStore.getState()).toMatchObject({ pair: { public_key: publicKey }, saved: true });
    expect(screen.getByText(publicKey.slice(0, 8))).toBeInTheDocument();
  });

  it('says what is wrong with a file that is not a key file', async () => {
    renderWallet();

    fireEvent.change(screen.getByLabelText('Choose a key file'), { target: { files: [new File(['nope'], 'key.json')] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('This file is not a key file: it is not JSON.');
  });

  it('asks inline before forgetting the key, and keeps it on "Keep it"', () => {
    useKeyStore.setState({ pair: { public_key: publicKey, private_key: privateKey }, saved: true });
    renderWallet();

    fireEvent.click(screen.getByRole('button', { name: 'Forget this key in this tab' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(useKeyStore.getState().pair).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Forget this key in this tab' }));
    fireEvent.click(screen.getByRole('button', { name: 'Forget it' }));
    expect(useKeyStore.getState().pair).toBeNull();
    expect(screen.getByRole('heading', { name: 'Open a key file' })).toBeInTheDocument();
  });

  it('copies the address', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    useKeyStore.setState({ pair: { public_key: publicKey, private_key: privateKey }, saved: true });
    renderWallet();

    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }));

    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(publicKey);
  });

  it('says the keys stay in this tab', () => {
    renderWallet();

    expect(screen.getByText('Keys are created in this browser and kept only in this tab. VeriLedger never sees them.')).toBeInTheDocument();
  });
});
