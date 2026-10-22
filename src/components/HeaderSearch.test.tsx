import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findBlockNumber, findHash } from '../services/ledger';
import type { Transaction } from '../types/ledger';
import { HeaderSearch } from './HeaderSearch';

vi.mock('../services/ledger', () => ({ findBlockNumber: vi.fn(), findHash: vi.fn() }));

const hash = 'ab'.repeat(32);

function Where() {
  const { pathname, search } = useLocation();
  return <p data-testid="where">{pathname + search}</p>;
}

function renderSearch() {
  render(
    <MemoryRouter initialEntries={['/wallet']}>
      <HeaderSearch />
      <Where />
    </MemoryRouter>,
  );
  return screen.getByRole('searchbox', { name: 'Search a block number or a hash' });
}

describe('HeaderSearch', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('finds a block by its number and opens it on the chain', async () => {
    vi.mocked(findBlockNumber).mockResolvedValue([{ kind: 'block', number: 3, hash: '0000b0d1e67c' + 'ab'.repeat(26) }]);
    const input = renderSearch();

    fireEvent.change(input, { target: { value: '#3' } });
    fireEvent.click(await screen.findByRole('button', { name: /Block #3/ }));

    expect(findBlockNumber).toHaveBeenCalledWith(3);
    expect(screen.getByTestId('where')).toHaveTextContent('/?block=3');
    expect(input).toHaveValue('');
  });

  it('finds a transaction by its full hash, and Enter opens the first result', async () => {
    const transaction = { tx_hash: hash, sender_address: 'x', receiver_address: 'y', amount: 1, status: 'PENDING' } as Transaction;
    vi.mocked(findHash).mockResolvedValue([{ kind: 'transaction', transaction }]);
    const input = renderSearch();

    fireEvent.change(input, { target: { value: hash.toUpperCase() } });
    expect(await screen.findByRole('option', { name: 'Transfer abababab… waiting' })).toBeInTheDocument();
    fireEvent.submit(input.closest('form')!);

    expect(findHash).toHaveBeenCalledWith(hash);
    expect(screen.getByTestId('where')).toHaveTextContent(`/transaction/${hash}`);
  });

  it('asks for a number or a full hash, because the API cannot search by prefix', async () => {
    const input = renderSearch();

    fireEvent.change(input, { target: { value: 'abab12' } });

    expect(await screen.findByText('Type a block number or a full 64-character hash.')).toBeInTheDocument();
    expect(findHash).not.toHaveBeenCalled();
  });

  it('says when nothing has the hash, or the block is not mined yet', async () => {
    vi.mocked(findHash).mockResolvedValue([]);
    vi.mocked(findBlockNumber).mockResolvedValue([]);
    const input = renderSearch();

    fireEvent.change(input, { target: { value: hash } });
    expect(await screen.findByText('No block or transaction with this hash on this node.')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '99' } });
    expect(await screen.findByText('No block #99 yet.')).toBeInTheDocument();
  });

  it('closes the results with Escape', async () => {
    const input = renderSearch();
    fireEvent.change(input, { target: { value: 'abc' } });
    await screen.findByRole('listbox');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
