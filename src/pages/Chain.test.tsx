import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startDemo } from '../services/auth';
import { getBlock, getBlocks, getPendingTransactions, mineBlock } from '../services/ledger';
import { useAppStore } from '../store/useAppStore';
import { useHealthStore } from '../store/useHealthStore';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { useToastStore } from '../store/useToastStore';
import type { Block, Paginated, Transaction } from '../types/ledger';
import { Chain } from './Chain';

vi.mock('../services/ledger', () => ({
  getBlocks: vi.fn(),
  getBlock: vi.fn(),
  getPendingTransactions: vi.fn(),
  mineBlock: vi.fn(),
}));
vi.mock('../services/auth', () => ({ startDemo: vi.fn() }));

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
  signature: '',
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
  signature: 'ab'.repeat(64),
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

function renderChain(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Chain />
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

describe('Chain', () => {
  beforeEach(() => {
    useHealthStore.setState({ online: true });
    useToastStore.setState({ toasts: [] });
    useAppStore.setState({ token: 'abc.def.ghi', user: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    usePreferencesStore.setState({ language: 'en' });
  });

  it('speaks Spanish when that is the language', async () => {
    usePreferencesStore.setState({ language: 'es' });
    serve(chainOf(3), [transfer]);
    renderChain();

    expect(await screen.findByRole('list', { name: 'Los 3 bloques más nuevos, del #0 al #2. Desplázate hacia los lados.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'La cadena' })).toBeInTheDocument();
    expect(screen.getByText('Altura')).toBeInTheDocument();
    expect(screen.getByText('Nada aún: es el bloque más nuevo')).toBeInTheDocument();
    expect(screen.getByText('#2 es el bloque más nuevo. El siguiente enlazará a su huella.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Transferencia/ })).toHaveTextContent('comisión 0.10');
  });

  it('draws a skeleton until the first answer', () => {
    vi.mocked(getBlocks).mockReturnValue(new Promise(() => {}));
    vi.mocked(getPendingTransactions).mockReturnValue(new Promise(() => {}));
    renderChain();

    expect(screen.getByRole('status', { name: 'Loading blocks' })).toBeInTheDocument();
    expect(screen.getByText('Loading blocks…')).toBeInTheDocument();
    expect(stat('Height')).toHaveTextContent('—');
  });

  it('draws the newest blocks, selects the top one and lists what is waiting', async () => {
    serve(chainOf(3), [transfer]);
    renderChain();

    expect(await screen.findByRole('list', { name: 'The 3 newest blocks, #0 to #2. Scroll sideways.' })).toBeInTheDocument();
    expect(stat('Height')).toHaveTextContent('2');
    expect(stat('Waiting')).toHaveTextContent('1');
    expect(blockButton(2)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: '#2' })).toBeInTheDocument();
    expect(screen.getByText('Nothing yet: it is the newest block')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Mining reward/ })).toHaveAttribute('href', '/transaction/rh2');
    const waiting = screen.getByRole('link', { name: /Transfer/ });
    expect(waiting).toHaveAttribute('href', '/transaction/ph1');
    expect(waiting).toHaveTextContent('fee 0.10');
  });

  it('lights the link of the block pointed at, and says what it links to', async () => {
    serve(chainOf(3));
    renderChain();
    const tile = await screen.findByRole('button', { name: /^#1 .* · 1 tx, links to #0$/ });

    fireEvent.mouseEnter(tile);

    expect(screen.getByText('The fingerprint of #1 is exactly what #2 links to.')).toBeInTheDocument();
    expect(tile).toHaveStyle({ transform: 'translateY(-4px)' });
    fireEvent.click(tile);
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('search')).toHaveTextContent('?block=1');
  });

  it('keeps the chain when the node sends a time it cannot read', async () => {
    serve([{ ...block(0), timestamp: 'not a date' }]);
    renderChain();

    expect(await screen.findByRole('heading', { name: '#0' })).toBeInTheDocument();
    expect(stat('Last block')).toHaveTextContent('—');
    expect(blockButton(0)).toHaveTextContent('1 tx · —');
  });

  it('says the first block mined becomes the genesis block', async () => {
    serve([]);
    renderChain();

    expect(await screen.findByText('No blocks yet. The first block mined becomes the genesis block, number 0.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'No blocks yet' })).toBeInTheDocument();
    expect(screen.getByText('the genesis block')).toBeInTheDocument();
    expect(screen.getByText('Nothing waiting. New transactions appear here within 10 s.')).toBeInTheDocument();
  });

  it('announces a block that joined the chain, and a picked block stays selected', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    serve(chainOf(3));
    renderChain();
    await screen.findByRole('list', { name: /#0 to #2\./ });

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
    renderChain('/?block=2');

    expect(await screen.findByRole('heading', { name: '#2' })).toBeInTheDocument();
    expect(getBlocks).toHaveBeenCalledWith(12, 1);
    expect(screen.getByText('12 blocks link back to it')).toBeInTheDocument();
  });

  it('loads older blocks until the genesis block', async () => {
    serve(chainOf(12));
    renderChain();
    await screen.findByRole('list', { name: /#2 to #11\./ });
    expect(screen.getByText('+ 2 older blocks (#0 to #1)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Load older blocks' }));

    expect(await screen.findByRole('button', { name: 'All blocks loaded' })).toBeDisabled();
    expect(getBlocks).toHaveBeenCalledWith(10, 10);
    expect(blockButton(0)).toBeInTheDocument();
    expect(screen.getByText('all blocks loaded')).toBeInTheDocument();
  });

  it('shows the failure when /health answers but the blocks do not', async () => {
    vi.mocked(getBlocks).mockRejectedValue(new Error('Database is locked'));
    vi.mocked(getPendingTransactions).mockResolvedValue(page([]));
    renderChain();

    expect(await screen.findByRole('alert')).toHaveTextContent('Can’t load the blocks: Database is locked. Retrying every 10 s.');
    expect(screen.getByText('Not loaded yet · retrying every 10 s')).toBeInTheDocument();
  });

  it('leaves an unreachable API to the shell banner', async () => {
    useHealthStore.setState({ online: false });
    vi.mocked(getBlocks).mockRejectedValue(new Error('Network Error'));
    vi.mocked(getPendingTransactions).mockRejectedValue(new Error('Network Error'));
    renderChain();

    expect(await screen.findByText('Not loaded yet · retrying every 10 s')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Chain mining', () => {
  const minerAddress = 'f'.repeat(64);
  const toasts = () => useToastStore.getState().toasts.map(({ text, kind }) => ({ text, kind }));

  async function readyToMine(path = '/') {
    renderChain(path);
    await screen.findByRole('list', { name: /newest blocks/ });
    fireEvent.change(screen.getByLabelText('Reward address'), { target: { value: ` ${minerAddress} ` } });
  }

  beforeEach(() => {
    useHealthStore.setState({ online: true, databaseDown: false, demoMode: false });
    useToastStore.setState({ toasts: [] });
    useAppStore.setState({
      token: 'abc.def.ghi',
      user: { id: '1', email: 'trader@veriledger.test', display_name: 'trader@veriledger.test', expires_at: null, role: 'trader', created_at: '', updated_at: '' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('mines the next block, then selects it and says its nonce and reward', async () => {
    serve(chainOf(3), [transfer]);
    await readyToMine('/?block=1');
    expect(screen.getByText('1 transaction will go into block #3.')).toBeInTheDocument();
    let seal: (sealed: Block) => void = () => {};
    vi.mocked(mineBlock).mockReturnValue(new Promise((resolve) => (seal = resolve)));

    fireEvent.click(screen.getByRole('button', { name: 'Mine block #3' }));

    expect(mineBlock).toHaveBeenCalledWith(minerAddress);
    expect(screen.getByRole('button', { name: 'Mining…' })).toBeDisabled();
    expect(screen.getByText(/The node answers when it finds a hash/)).toBeInTheDocument();

    serve(chainOf(4));
    await act(async () => seal(block(3)));

    await waitFor(() => expect(toasts()).toEqual([{ text: 'Block #3 sealed · nonce 1,003 · reward 50.00 VL', kind: 'ok' }]));
    expect(blockButton(3)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('search')).toBeEmptyDOMElement();
    expect(await screen.findByRole('button', { name: 'Mine block #4' })).toBeEnabled();
  });

  it("shows the API's refusal and lets the person try again", async () => {
    serve(chainOf(3));
    vi.mocked(mineBlock).mockRejectedValue(new Error('Invalid miner address'));
    await readyToMine();

    fireEvent.click(screen.getByRole('button', { name: 'Mine block #3' }));

    await waitFor(() => expect(toasts()).toEqual([{ text: 'Invalid miner address', kind: 'err' }]));
    expect(screen.getByRole('button', { name: 'Mine block #3' })).toBeEnabled();
  });

  it('tells a viewer that mining needs the trader or admin role', async () => {
    useAppStore.setState({ user: { id: '2', email: 'viewer@veriledger.test', display_name: 'viewer@veriledger.test', expires_at: null, role: 'viewer', created_at: '', updated_at: '' } });
    serve(chainOf(3));
    await readyToMine();

    expect(screen.getByText('Mining needs the trader or admin role.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mine block #3' })).toBeDisabled();
  });

  it('starts a demo in place from the mine button, and then mines with it', async () => {
    useAppStore.setState({ token: null, user: null });
    useHealthStore.setState({ online: true, demoMode: true });
    let created: (token: string) => void = () => {};
    vi.mocked(startDemo).mockReturnValue(new Promise((resolve) => (created = resolve)));
    serve(chainOf(3));
    await readyToMine();
    expect(screen.getByText('Anyone can look. To mine, start a demo: one click, no email.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try the demo to mine' }));

    expect(screen.getByRole('button', { name: 'Starting a demo…' })).toBeDisabled();
    await act(async () => created('demo.jwt.token'));
    expect(useAppStore.getState().token).toBe('demo.jwt.token');
    expect(screen.getByRole('button', { name: 'Mine block #3' })).toBeEnabled();
  });

  it('lets a visitor look, and offers to sign in to mine', async () => {
    useAppStore.setState({ token: null, user: null });
    useHealthStore.setState({ online: true, databaseDown: false, demoMode: false });
    serve(chainOf(3), [transfer]);
    await readyToMine('/?block=1');

    expect(screen.getByText('Anyone can look. To mine, sign in.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mine block #3' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in to mine' })).toHaveAttribute('href', '/login');
    fireEvent.submit(screen.getByLabelText('Reward address').closest('form')!);
    expect(mineBlock).not.toHaveBeenCalled();
  });

  it('says that mining waits for the API’s database, when only the database is down', async () => {
    useHealthStore.setState({ online: false, databaseDown: true });
    serve(chainOf(3));
    await readyToMine();

    expect(screen.getByText('Mining is unavailable while the API’s database does not answer.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mine block #3' })).toBeDisabled();
  });

  it('does not offer mining while the API is unreachable', async () => {
    useHealthStore.setState({ online: false });
    serve(chainOf(3));
    await readyToMine();

    expect(screen.getByText('Mining is unavailable while the API is unreachable.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mine block #3' })).toBeDisabled();
  });

  it('offers the genesis block on an empty chain', async () => {
    serve([]);
    renderChain();

    expect(await screen.findByRole('button', { name: 'Mine the genesis block' })).toBeInTheDocument();
    expect(screen.getByText('The first block you mine becomes the genesis block.')).toBeInTheDocument();
    await expect(document.body).toPassAxe();
  });
});
