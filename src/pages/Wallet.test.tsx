import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import vectors from '../lib/__fixtures__/signing-vectors.json';
import { keyFileText } from '../lib/keyFile';
import { keyPairFromSecret } from '../lib/keys';
import { getBalance, getWalletTransactions } from '../services/wallets';
import { useKeyStore } from '../store/useKeyStore';
import type { Paginated, Transaction } from '../types/ledger';
import { Wallet } from './Wallet';

vi.mock('../services/wallets', () => ({ getBalance: vi.fn(), getWalletTransactions: vi.fn() }));

// RFC 8032 test keys from the API's vectors: published, test-only.
const { public_key: publicKey, private_key: privateKey } = vectors.vectors[0];

const page = (items: Transaction[], total = items.length): Paginated<Transaction> => ({ items, total, page: 1, size: 20 });

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
    vi.mocked(getWalletTransactions).mockResolvedValue(page([]));
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
    await expect(document.body).toPassAxe();
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
    await expect(document.body).toPassAxe();
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

describe('Wallet activity and look-up', () => {
  const tx = (patch: Partial<Transaction>): Transaction => ({
    id: patch.tx_hash ?? 't',
    sender_address: publicKey,
    receiver_address: 'cd'.repeat(32),
    amount: 0,
    fee: 0,
    status: 'CONFIRMED',
    signature: 'ab'.repeat(64),
    timestamp: '2026-10-21T15:00:00Z',
    block_number: 4,
    ...patch,
  });
  const reward = tx({ tx_hash: 'r1', sender_address: 'SYSTEM', receiver_address: publicKey, amount: 50, block_number: 3 });
  const sent = tx({ tx_hash: 's1', amount: 10, fee: 0.1 });

  beforeEach(() => {
    useKeyStore.setState({ pair: { public_key: publicKey, private_key: privateKey }, saved: true });
    vi.mocked(getBalance).mockResolvedValue(39.9);
    vi.mocked(getWalletTransactions).mockResolvedValue(page([]));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists the address's activity, linked to each transaction, and adds it up", async () => {
    vi.mocked(getWalletTransactions).mockResolvedValue(page([sent, reward]));
    renderWallet();

    expect(await screen.findByRole('link', { name: /Sent to cdcdcdcd…cdcd/ })).toHaveAttribute('href', '/transaction/s1');
    expect(screen.getByRole('link', { name: /Mining reward/ })).toHaveAttribute('href', '/transaction/r1');
    expect(screen.getByText('−10.10')).toBeInTheDocument();
    expect(screen.getByText('50.00 received · 10.10 sent · 0.00 waiting')).toBeInTheDocument();
    expect(getWalletTransactions).toHaveBeenCalledWith(publicKey, 0, 20);
  });

  it('adds up nothing until the whole activity is loaded', async () => {
    vi.mocked(getWalletTransactions).mockResolvedValue(page([sent, reward], 25));
    renderWallet();

    expect(await screen.findByText('The 2 newest of 25.')).toBeInTheDocument();
    expect(screen.queryByText(/received ·/)).not.toBeInTheDocument();
  });

  it('points a new address to the tower', async () => {
    renderWallet();

    expect(await screen.findByText(/No transactions yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the tower' })).toHaveAttribute('href', '/');
    expect(screen.getByText('New address: nothing received yet')).toBeInTheDocument();
  });

  it('looks up any address, and says what is wrong with one that is not', async () => {
    renderWallet();
    const input = screen.getByLabelText('Address');

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(screen.getByText('3 / 64')).toBeInTheDocument();
    fireEvent.submit(input.closest('form')!);
    expect(await screen.findByText('An address has 64 characters from 0–9 and a–f.')).toBeInTheDocument();

    vi.mocked(getBalance).mockResolvedValue(12.5);
    fireEvent.change(input, { target: { value: ` ${'EF'.repeat(32)} ` } });
    fireEvent.submit(input.closest('form')!);
    expect(await screen.findByText('12.50 VL')).toBeInTheDocument();
    expect(getBalance).toHaveBeenLastCalledWith('ef'.repeat(32));
  });

  it('keeps the page while letters past f are typed, and says what is wrong', async () => {
    renderWallet();
    const input = screen.getByLabelText('Address');

    fireEvent.change(input, { target: { value: 'hello' } });
    expect(screen.getByText('5 / 64')).toBeInTheDocument();
    fireEvent.submit(input.closest('form')!);
    expect(await screen.findByText('An address has 64 characters from 0–9 and a–f.')).toBeInTheDocument();
    expect(getBalance).not.toHaveBeenCalledWith('hello');
  });
});
