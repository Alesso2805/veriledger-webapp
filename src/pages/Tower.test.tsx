import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBlock, getBlocks, getPendingTransactions } from '../services/ledger';
import { useHealthStore } from '../store/useHealthStore';
import { useToastStore } from '../store/useToastStore';
import type { Block, Paginated, Transaction } from '../types/ledger';
import { Tower } from './Tower';

vi.mock('../services/ledger', () => ({
  getBlocks: vi.fn(),
  getBlock: vi.fn(),
  getPendingTransactions: vi.fn(),
}));

const sealed = '2026-10-21T15:00:00Z';
const hash = (n: number) => `0000${String(n).padStart(4, '0')}${'ab'.repeat(28)}`;
const block = (n: number): Block => ({
  id: `b${n}`,
  block_number: n,
  previous_hash: n ? hash(n - 1) : '0'.repeat(64),
  timestamp: sealed,
  nonce: 1000 + n,
  block_hash: hash(n),
  transaction_ids: [`r${n}`],
  transaction_hashes: [`rh${n}`],
});
// Newest first, as the API answers.
const chainOf = (count: number) => Array.from({ length: count }, (_, index) => block(count - 1 - index));
const page = <T,>(items: T[], total = items.length): Paginated<T> => ({ items, total, page: 1, size: 10 });
const reward = (n: number): Transaction => ({
  id: `r${n}`,
  sender_address: 'SYSTEM',
  receiver_address: 'f'.repeat(64),
  amount: 50,
  fee: 0,
  status: 'CONFIRMED',
  timestamp: sealed,
  tx_hash: `rh${n}`,
  payload: null,
});
const transfer: Transaction = {
  id: 'p1',
  sender_address: 'a'.repeat(64),
  receiver_address: 'b'.repeat(64),
  amount: 10,
  fee: 0.1,
  status: 'PENDING',
  timestamp: sealed,
  tx_hash: 'ph1',
  payload: null,
};

function serve(blocks: Block[], waiting: Transaction[] = []) {
  vi.mocked(getBlocks).mockImplementation(async (skip, limit) => page(blocks.slice(skip, skip + limit), blocks.length));
  vi.mocked(getPendingTransactions).mockResolvedValue(page(waiting));
  vi.mocked(getBlock).mockImplementation(async (blockHash) => {
    const { transaction_ids: _ids, transaction_hashes: _hashes, ...found } = blocks.find((b) => b.block_hash === blockHash)!;
    return { ...found, transactions: [reward(found.block_number)] };
  });
}

function Search() {
  return <p data-testid="search">{useLocation().search}</p>;
}

function renderTower(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Tower />
              <Search />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

const stat = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling;
const blockButton = (n: number) => screen.getByRole('button', { name: new RegExp(`^Block #${n} `) });
const poll = () => act(() => vi.advanceTimersByTimeAsync(10_000));

describe('Tower', () => {
  beforeEach(() => {
    useHealthStore.setState({ online: true });
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('draws a skeleton until the first answer', () => {
    vi.mocked(getBlocks).mockReturnValue(new Promise(() => {}));
    vi.mocked(getPendingTransactions).mockReturnValue(new Promise(() => {}));
    renderTower();

    expect(screen.getByRole('img', { name: 'Loading blocks' })).toBeInTheDocument();
    expect(screen.getByText('Loading blocks…')).toBeInTheDocument();
    expect(stat('Height')).toHaveTextContent('—');
  });

  it('draws the newest blocks, selects the top one and lists what is waiting', async () => {
    serve(chainOf(3), [transfer]);
    renderTower();

    expect(await screen.findByRole('img', { name: 'Tower of the 3 newest blocks, #0 at the bottom and #2 on top' })).toBeInTheDocument();
    expect(stat('Height')).toHaveTextContent('2');
    expect(stat('Waiting')).toHaveTextContent('1');
    expect(blockButton(2)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: '#2' })).toBeInTheDocument();
    expect(screen.getByText('Nothing yet: it is the top of the tower')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Mining reward/ })).toHaveAttribute('href', '/transaction/rh2');
    const waiting = screen.getByRole('link', { name: /Transfer/ });
    expect(waiting).toHaveAttribute('href', '/transaction/ph1');
    expect(waiting).toHaveTextContent('fee 0.10');
  });

  it('says the first block mined becomes the genesis block', async () => {
    serve([]);
    renderTower();

    expect(await screen.findByText('No blocks yet. The first block mined becomes the genesis block, number 0.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'No blocks yet' })).toBeInTheDocument();
    expect(screen.getByText('Nothing waiting. New transactions appear here within 10 s.')).toBeInTheDocument();
  });

  it('announces a block that joined the chain, and a picked block stays selected', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    serve(chainOf(3));
    renderTower();
    await screen.findByRole('img', { name: /#2 on top/ });

    serve(chainOf(4));
    await poll();

    expect(useToastStore.getState().toasts.map((t) => t.text)).toEqual(['Block #3 joined the chain.']);
    expect(stat('Height')).toHaveTextContent('3');
    expect(blockButton(3)).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(blockButton(1));
    expect(screen.getByTestId('search')).toHaveTextContent('?block=1');
    serve(chainOf(5));
    await poll();

    expect(blockButton(1)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: '#1' })).toBeInTheDocument();
  });

  it('opens the block of a deep link, even below the loaded pages', async () => {
    serve(chainOf(15));
    renderTower('/?block=2');

    expect(await screen.findByRole('heading', { name: '#2' })).toBeInTheDocument();
    expect(getBlocks).toHaveBeenCalledWith(12, 1);
    expect(screen.getByText('12 blocks rest on it')).toBeInTheDocument();
  });

  it('loads older blocks until the genesis block', async () => {
    serve(chainOf(12));
    renderTower();
    await screen.findByRole('img', { name: /#11 on top/ });
    expect(screen.getByText('+ 2 older blocks below (#0 to #1)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Load older blocks' }));

    expect(await screen.findByRole('button', { name: 'All blocks loaded' })).toBeDisabled();
    expect(getBlocks).toHaveBeenCalledWith(10, 10);
    expect(blockButton(0)).toBeInTheDocument();
    expect(screen.getByText('all blocks loaded')).toBeInTheDocument();
  });

  it('shows the failure when /health answers but the blocks do not', async () => {
    vi.mocked(getBlocks).mockRejectedValue(new Error('Database is locked'));
    vi.mocked(getPendingTransactions).mockResolvedValue(page([]));
    renderTower();

    expect(await screen.findByRole('alert')).toHaveTextContent('Can’t load the blocks: Database is locked. Retrying every 10 s.');
    expect(screen.getByText('Not loaded yet · retrying every 10 s')).toBeInTheDocument();
  });

  it('leaves an unreachable API to the shell banner', async () => {
    useHealthStore.setState({ online: false });
    vi.mocked(getBlocks).mockRejectedValue(new Error('Network Error'));
    vi.mocked(getPendingTransactions).mockRejectedValue(new Error('Network Error'));
    renderTower();

    expect(await screen.findByText('Not loaded yet · retrying every 10 s')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
