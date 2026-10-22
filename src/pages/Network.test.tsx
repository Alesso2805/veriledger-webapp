import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fingerprint } from '../lib/fingerprint';
import { peerHex } from '../lib/peers';
import { getBlocks } from '../services/ledger';
import { getPeers, registerPeer, resolveConflicts } from '../services/nodes';
import { useAppStore } from '../store/useAppStore';
import type { Block, Paginated } from '../types/ledger';
import type { Peer } from '../types/network';
import { Network } from './Network';

vi.mock('../services/nodes', () => ({ getPeers: vi.fn(), registerPeer: vi.fn(), resolveConflicts: vi.fn() }));
vi.mock('../services/ledger', () => ({ getBlocks: vi.fn() }));

const peer = (url: string): Peer => ({ id: url, url, status: 'ACTIVE' });
const admin = { id: '1', email: 'admin@veriledger.test', display_name: 'admin@veriledger.test', expires_at: null, role: 'admin' as const, created_at: '', updated_at: '' };

describe('Network', () => {
  beforeEach(() => {
    useAppStore.setState({ token: 'abc.def.ghi', user: admin });
    vi.mocked(getPeers).mockResolvedValue([peer('https://node-b.example.org'), peer('http://127.0.0.1:8001')]);
    vi.mocked(getBlocks).mockResolvedValue({ items: [{ block_number: 5 } as Block], total: 6, page: 1, size: 1 } as Paginated<Block>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('draws this node with its height and its peers, each only "registered"', async () => {
    render(<Network />);

    expect(await screen.findByRole('img', { name: 'This node at height 5, with 2 peers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Registered peers · 2' })).toBeInTheDocument();
    expect(screen.getAllByText('registered')).toHaveLength(2);
    expect(screen.queryByText(/active/i)).not.toBeInTheDocument();
    expect(screen.getByText('node-b')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
  });

  it("gives each peer the avatar of its URL, on the map and in the list", async () => {
    render(<Network />);
    const row = (await screen.findByText('https://node-b.example.org')).closest('li')!;
    const colours = fingerprint(peerHex('https://node-b.example.org'), 4);

    // jsdom keeps the colour as written in the style, so compare against the same element's colouring.
    const drawn = (element: Element) => [...element.querySelector('[aria-hidden="true"]')!.children].map((bar) => (bar as HTMLElement).style.background);
    const expected = colours.map((colour) => {
      const probe = document.createElement('span');
      probe.style.background = colour ?? '';
      return probe.style.background;
    });
    expect(drawn(row)).toEqual(expected);
    expect(drawn(screen.getByText('node-b').parentElement!)).toEqual(expected);
  });

  it('opens a narrow map on this node, in its middle', async () => {
    // jsdom has no layout: give the map's box a phone's width and the map's own.
    const scrollWidth = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(860);
    const clientWidth = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(326);
    try {
      render(<Network />);
      await screen.findByRole('heading', { name: 'Registered peers · 2' });

      expect(screen.getByRole('region', { name: 'Peer map' }).scrollLeft).toBe(267);
    } finally {
      scrollWidth.mockRestore();
      clientWidth.mockRestore();
    }
  });

  it('adds a peer, and lists it once the node has it', async () => {
    vi.mocked(registerPeer).mockResolvedValue(peer('https://node-e.example.org'));
    render(<Network />);
    await screen.findByRole('heading', { name: 'Registered peers · 2' });
    vi.mocked(getPeers).mockResolvedValue([
      peer('https://node-b.example.org'),
      peer('http://127.0.0.1:8001'),
      peer('https://node-e.example.org'),
    ]);

    fireEvent.change(screen.getByLabelText('Peer address'), { target: { value: ' https://node-e.example.org ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add peer' }));

    expect(await screen.findByRole('heading', { name: 'Registered peers · 3' })).toBeInTheDocument();
    expect(registerPeer).toHaveBeenCalledWith('https://node-e.example.org');
    expect(screen.getByLabelText('Peer address')).toHaveValue('');
  });

  it('checks the form of the address before asking the node', async () => {
    render(<Network />);

    fireEvent.change(screen.getByLabelText('Peer address'), { target: { value: 'node-e.example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add peer' }));

    expect(await screen.findByText('Use a full address that starts with http:// or https://.')).toBeInTheDocument();
    expect(registerPeer).not.toHaveBeenCalled();
  });

  it('shows why the node refused a peer, in its own words', async () => {
    vi.mocked(registerPeer).mockRejectedValue(
      new Error("The peer's host is not a public address: 10.0.0.5. Loopback, private, link-local and reserved addresses need ALLOW_PRIVATE_PEERS"),
    );
    render(<Network />);

    fireEvent.change(screen.getByLabelText('Peer address'), { target: { value: 'http://10.0.0.5:8000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add peer' }));

    expect(await screen.findByText(/The peer's host is not a public address: 10.0.0.5/)).toBeInTheDocument();
    expect(screen.getByLabelText('Peer address')).toHaveAttribute('aria-invalid', 'true');
    await expect(document.body).toPassAxe();
  });

  it('keeps the field and its focus when the person types after a refusal', async () => {
    render(<Network />);
    fireEvent.change(screen.getByLabelText('Peer address'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add peer' }));
    await screen.findByText('Use a full address that starts with http:// or https://.');

    const input = screen.getByLabelText('Peer address');
    input.focus();
    fireEvent.change(input, { target: { value: 'h' } });

    // Remounting the form here would drop the focus after the first character.
    expect(screen.getByLabelText('Peer address')).toHaveFocus();
    expect(screen.getByText('The peer’s public address, starting with http:// or https://.')).toBeInTheDocument();
  });

  it('sends pulses to every peer while resolving, then says it adopted a longer chain and how high it is', async () => {
    let answer: (outcome: { message: string; replaced: boolean }) => void = () => {};
    vi.mocked(resolveConflicts).mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { container } = render(<Network />);
    await screen.findByRole('heading', { name: 'Registered peers · 2' });

    fireEvent.click(screen.getByRole('button', { name: 'Resolve conflicts' }));

    expect(screen.getByRole('button', { name: 'Asking 2 peers…' })).toBeDisabled();
    expect(container.querySelectorAll('.animate-vl-travel')).toHaveLength(2);
    vi.mocked(getBlocks).mockResolvedValue({ items: [{ block_number: 8 } as Block], total: 9, page: 1, size: 1 } as Paginated<Block>);
    await act(async () => answer({ message: 'Our chain was replaced', replaced: true }));

    expect(await screen.findByText('Adopted a longer valid chain')).toBeInTheDocument();
    expect(screen.getByText('Height went from 5 to 8. Every block was checked before replacing ours.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'This node at height 8, with 2 peers' })).toBeInTheDocument();
  });

  it('says when no peer had a longer valid chain', async () => {
    vi.mocked(resolveConflicts).mockResolvedValue({ message: 'Our chain is authoritative', replaced: false });
    render(<Network />);
    await screen.findByRole('heading', { name: 'Registered peers · 2' });

    fireEvent.click(screen.getByRole('button', { name: 'Resolve conflicts' }));

    expect(await screen.findByText('Our chain is already the longest valid one')).toBeInTheDocument();
    expect(screen.getByText('No peer had a longer valid chain. Nothing changed.')).toBeInTheDocument();
  });

  it('says when resolving failed, with the API’s words', async () => {
    vi.mocked(resolveConflicts).mockRejectedValue(new Error('Request failed with status code 502'));
    render(<Network />);
    await screen.findByRole('heading', { name: 'Registered peers · 2' });

    fireEvent.click(screen.getByRole('button', { name: 'Resolve conflicts' }));

    expect(await screen.findByText('Could not finish resolving')).toBeInTheDocument();
    expect(screen.getByText('Request failed with status code 502. Nothing changed; try again.')).toBeInTheDocument();
  });

  it('does not offer to resolve without peers', async () => {
    vi.mocked(getPeers).mockResolvedValue([]);
    render(<Network />);

    await screen.findByText('No peers yet. Add one to share the chain with another node.');
    expect(screen.getByRole('button', { name: 'Resolve conflicts' })).toBeDisabled();
  });

  it('lets other roles look without the form', async () => {
    useAppStore.setState({ user: { ...admin, role: 'viewer' } });
    render(<Network />);

    expect(await screen.findByText(/Only an admin can add peers or resolve conflicts/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Peer address')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolve conflicts' })).toBeDisabled();
  });

  it('lets a visitor look at the peers, and nothing more', async () => {
    useAppStore.setState({ token: null, user: null });
    render(<Network />);

    expect(await screen.findByRole('heading', { name: 'Registered peers · 2' })).toBeInTheDocument();
    expect(screen.getByText(/Only an admin can add peers or resolve conflicts/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Peer address')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolve conflicts' })).toBeDisabled();
  });

  it('says when there are no peers, and when the node did not answer', async () => {
    vi.mocked(getPeers).mockResolvedValue([]);
    const { unmount } = render(<Network />);
    expect(await screen.findByText('No peers yet. Add one to share the chain with another node.')).toBeInTheDocument();
    unmount();

    vi.mocked(getPeers).mockRejectedValue(new Error('Network Error'));
    render(<Network />);
    expect(await screen.findByText('The node did not answer, so its peers are not shown.')).toBeInTheDocument();
  });
});
