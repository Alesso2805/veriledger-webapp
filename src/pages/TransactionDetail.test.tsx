import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import vectors from '../lib/__fixtures__/signing-vectors.json';
import { statusOf } from '../services/api';
import { getBlock, getBlocks, getTransaction } from '../services/ledger';
import { useHealthStore } from '../store/useHealthStore';
import type { Block, FullBlock, Paginated, Transaction } from '../types/ledger';
import { TransactionDetail } from './TransactionDetail';

vi.mock('../services/ledger', () => ({ getTransaction: vi.fn(), getBlocks: vi.fn(), getBlock: vi.fn() }));
vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/api')>()),
  statusOf: vi.fn(),
}));

const txHash = 'c4'.repeat(32);

// One of the API's own vectors as the API would store it: amounts as numbers, the nonce, the signature.
function stored(name: string, patch: Partial<Transaction> = {}): Transaction {
  const { fields, signature } = vectors.vectors.find((vector) => vector.name === name)!;
  return {
    id: 't',
    sender_address: fields.sender_address,
    receiver_address: fields.receiver_address,
    amount: Number(fields.amount),
    fee: Number(fields.fee),
    nonce: fields.nonce,
    payload: 'payload' in fields ? fields.payload : null,
    signature,
    status: 'CONFIRMED',
    timestamp: '2026-10-21T15:00:00Z',
    tx_hash: txHash,
    block_number: 3,
    block_hash: '0000b0d1e67c' + 'ab'.repeat(26),
    ...patch,
  };
}

const height = (top: number) => ({ items: [{ block_number: top } as Block], total: top + 1, page: 1, size: 1 }) as Paginated<Block>;

// A journey step reads its label and its state together, as a screen reader hears it: "Buried, done".
const step = (text: string) =>
  screen.getByText((_, element) => element?.tagName === 'SPAN' && element.textContent === text && element.children.length === 1);

function renderPage() {
  render(
    <MemoryRouter initialEntries={[`/transaction/${txHash}`]}>
      <Routes>
        <Route path="/transaction/:hash" element={<TransactionDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TransactionDetail', () => {
  beforeEach(() => {
    useHealthStore.setState({ online: true });
    vi.mocked(getBlocks).mockResolvedValue(height(5));
    vi.mocked(getBlock).mockResolvedValue({ timestamp: '2026-10-20T16:21:55Z' } as FullBlock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows a sealed transfer: its journey, its details and its block, with the signature checked here', async () => {
    vi.mocked(getTransaction).mockResolvedValue(stored('transfer'));
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: '10.00 VL from d75a…511a to 3d40…660c' })).toBeInTheDocument();
    expect(getTransaction).toHaveBeenCalledWith(txHash);
    expect(screen.getByText('21 Oct 2026 · 15:00:00 UTC')).toBeInTheDocument();
    expect(screen.getByText('In block #3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Block #3' })).toHaveAttribute('href', '/?block=3');
    expect(step('Buried, done')).toBeInTheDocument();
    expect(screen.getAllByText('2 blocks on top').length).toBeGreaterThan(0);
    expect(screen.getByText('Signature checked in this browser against the sender’s address')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sealed in Block #3/ })).toHaveAttribute('href', '/?block=3');
  });

  it('says so when the stored transaction does not match its signature', async () => {
    vi.mocked(getTransaction).mockResolvedValue(stored('transfer', { amount: 11 }));
    renderPage();

    expect(await screen.findByText('The signature does not match this transaction and the sender’s address')).toBeInTheDocument();
  });

  it('follows a waiting notarization until it is sealed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(getTransaction).mockResolvedValue(stored('notarization', { status: 'PENDING', block_number: null, block_hash: null }));
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'A document waiting to be sealed' })).toBeInTheDocument();
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByText('Waiting for the next block. This page checks again every 10 s.')).toBeInTheDocument();
    expect(screen.queryByText('Sealed in')).not.toBeInTheDocument();
    expect(screen.queryByText('PROOF OF EXISTENCE')).not.toBeInTheDocument();

    vi.mocked(getTransaction).mockResolvedValue(stored('notarization', { block_number: 5 }));
    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(screen.getByRole('heading', { level: 1, name: 'A document notarized by fc51…8025' })).toBeInTheDocument();
    expect(screen.getByText('In block #5')).toBeInTheDocument();
    expect(step('Sealed, done')).toBeInTheDocument();
    expect(step('Buried, not yet')).toBeInTheDocument();
  });

  it('explains a hash this node does not know', async () => {
    vi.mocked(getTransaction).mockRejectedValue(new Error('Transaction not found'));
    vi.mocked(statusOf).mockReturnValue(404);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'No transaction with this hash on this node' })).toBeInTheDocument();
    expect(screen.getByText(txHash)).toBeInTheDocument();
    expect(screen.getByText(/Rejected transactions leave no trace/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the tower' })).toHaveAttribute('href', '/');
    await expect(document.body).toPassAxe();
  });

  it('says that a mining reward has no signature to check, and that the miner’s node created it', async () => {
    vi.mocked(getTransaction).mockResolvedValue(stored('transfer', { sender_address: 'SYSTEM', signature: 'COINBASE', amount: 50 }));
    renderPage();

    expect(await screen.findByText('A mining reward has no signature: the block’s proof of work seals it')).toBeInTheDocument();
    expect(step('Created, done')).toBeInTheDocument();
    expect(screen.getByText('by the node that mined it')).toBeInTheDocument();
    expect(screen.queryByText('by the sender, in their browser')).not.toBeInTheDocument();
  });

  it('shows a failure the shell does not explain, with the API’s words', async () => {
    vi.mocked(getTransaction).mockRejectedValue(new Error('Internal Server Error'));
    vi.mocked(statusOf).mockReturnValue(500);
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Can’t load this transaction: Internal Server Error. Retrying every 10 s.');
  });

  it("certifies a sealed notarization at its block's seal, and checks a file in the browser", async () => {
    const abc = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    vi.mocked(getTransaction).mockResolvedValue(stored('notarization', { payload: abc }));
    renderPage();

    expect(await screen.findByRole('heading', { name: 'This document existed on 20 October 2026 at 16:21:55 UTC.' })).toBeInTheDocument();
    expect(getBlock).toHaveBeenCalledWith(stored('notarization').block_hash);
    const groups = screen.getByRole('list', { name: 'Document fingerprint, SHA-256' });
    expect(groups.querySelectorAll('li')).toHaveLength(8);
    expect(groups).toHaveTextContent('ba7816bf8f01cfea');

    const chooser = screen.getByLabelText(/Choose a file/);
    fireEvent.change(chooser, { target: { files: [new File(['abc'], 'contract.txt')] } });
    expect(await screen.findByText('contract.txt is exactly the certified document.')).toBeInTheDocument();

    fireEvent.change(chooser, { target: { files: [new File(['abd'], 'contract (edited).txt')] } });
    expect(await screen.findByText('No match')).toBeInTheDocument();
    expect(screen.getByText(/contract \(edited\)\.txt differs from the certified document/)).toBeInTheDocument();
    await expect(document.body).toPassAxe();
  });
});
