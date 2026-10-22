import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { en } from '../lib/i18n/en';
import { es } from '../lib/i18n/es';
import { generateKeyPair } from '../lib/keys';
import { useAppStore } from '../store/useAppStore';
import { useHealthStore } from '../store/useHealthStore';
import { useKeyStore } from '../store/useKeyStore';
import { usePreferencesStore } from '../store/usePreferencesStore';
import type { Block, FullBlock, Paginated, Transaction } from '../types/ledger';

// AR-11: a page rendered in Spanish shows none of the English dictionary's texts (ADR-0007). A text written inline in
// a component, rather than taken from the dictionary, shows in English and fails here. The pages are drawn with the
// data of a running node: blocks, a waiting transfer, a sealed notarization, peers, a key in the tab.
const ADDRESS = 'ab'.repeat(32);
const OTHER = 'cd'.repeat(32);
const DOCUMENT = 'ef'.repeat(32);
const hash = (n: number) => `0000${n.toString(16).padStart(60, '0')}`;
const time = '2026-10-21T15:00:00Z';

const transaction = (extra: Partial<Transaction>): Transaction =>
  ({
    id: 't',
    sender_address: ADDRESS,
    receiver_address: OTHER,
    amount: 5,
    fee: 0.1,
    status: 'CONFIRMED',
    timestamp: time,
    signature: '00'.repeat(64),
    tx_hash: 'b1'.repeat(32),
    payload: null,
    nonce: 1,
    block_id: 'b2',
    block_number: 2,
    block_hash: hash(2),
    ...extra,
  }) as Transaction;

const reward = transaction({ id: 'r', sender_address: 'SYSTEM', receiver_address: ADDRESS, amount: 50, fee: 0, signature: '', tx_hash: 'c0'.repeat(32) });
const notarization = transaction({ id: 'n', receiver_address: ADDRESS, amount: 0, payload: DOCUMENT, tx_hash: 'd0'.repeat(32) });
const waiting = transaction({ id: 'w', status: 'PENDING', block_id: null, block_number: null, block_hash: null, tx_hash: 'e0'.repeat(32) });
const block = (n: number): Block =>
  ({ id: `b${n}`, block_number: n, previous_hash: n ? hash(n - 1) : '0'.repeat(64), timestamp: time, nonce: 1000 + n, block_hash: hash(n), transaction_ids: ['r'], transaction_hashes: [reward.tx_hash] }) as Block;
const page = <T,>(items: T[]): Paginated<T> => ({ items, total: items.length, page: 1, size: 10 }) as Paginated<T>;

vi.mock('../services/health', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/health')>()),
  getHealth: vi.fn(async () => ({ status: 'ok', demo_mode: true })),
}));
vi.mock('../services/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/auth')>()),
  getMe: vi.fn(async () => ({ id: '1', email: 'admin@veriledger.test', display_name: 'admin@veriledger.test', role: 'admin', expires_at: null })),
}));
vi.mock('../services/ledger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/ledger')>()),
  getBlocks: vi.fn(async (skip: number, limit: number) => page([2, 1, 0].slice(skip, skip + limit).map(block))),
  getBlock: vi.fn(async (blockHash: string) => ({ ...block(Number.parseInt(blockHash, 16)), transactions: [reward, notarization] }) as unknown as FullBlock),
  getPendingTransactions: vi.fn(async () => page([waiting])),
  getTransaction: vi.fn(async () => notarization),
}));
vi.mock('../services/wallets', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/wallets')>()),
  getBalance: vi.fn(async () => 94.5),
  getNextNonce: vi.fn(async () => 7),
  getWalletTransactions: vi.fn(async () => page([reward, notarization, waiting])),
}));
vi.mock('../services/nodes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/nodes')>()),
  getPeers: vi.fn(async () => [{ url: 'https://node-b.example.org', status: 'ACTIVE' }, { url: 'https://node-c.example.org', status: 'ACTIVE' }]),
}));

// Every English text that the Spanish dictionary says differently. Texts of three letters or fewer ("or", "EN")
// are left out: inside Spanish words they would match by chance.
function englishTexts(english: unknown, spanish: unknown): string[] {
  if (typeof english === 'string') return english !== spanish && english.length > 3 ? [english] : [];
  if (Array.isArray(english)) return english.flatMap((item, index) => englishTexts(item, (spanish as unknown[])[index]));
  if (english && typeof english === 'object') {
    return Object.entries(english).flatMap(([key, value]) => englishTexts(value, (spanish as Record<string, unknown>)[key]));
  }
  return [];
}
const ENGLISH = [...new Set(englishTexts(en, es))];

// The text a person meets: what is drawn, and the names and hints a screen reader reads. One line per text node, so
// texts that sit side by side on the page do not run into each other.
function shown(): string {
  const texts: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) texts.push(node.nodeValue ?? '');
  const attributes = [...document.querySelectorAll('[aria-label], [placeholder], [title]')].flatMap((element) =>
    ['aria-label', 'placeholder', 'title'].map((name) => element.getAttribute(name) ?? ''),
  );
  return [...texts, ...attributes].join('\n');
}

const letter = /\p{L}/u;
function englishIn(text: string): string[] {
  return ENGLISH.filter((english) => {
    for (let at = text.indexOf(english); at !== -1; at = text.indexOf(english, at + 1)) {
      if (!letter.test(text[at - 1] ?? '') && !letter.test(text[at + english.length] ?? '')) return true;
    }
    return false;
  });
}

interface Case {
  name: string;
  path: string;
  signedIn?: boolean;
  key?: boolean;
  // A Spanish text that shows once the page has its data.
  ready: string | RegExp;
}

const CASES: Case[] = [
  { name: 'the login', path: '/login', ready: '¿Solo quieres mirar?' },
  { name: 'the tower', path: '/', signedIn: true, ready: 'Nada aún: es la cima de la torre' },
  { name: 'the tower, to a visitor', path: '/', ready: 'Prueba la demo para minar' },
  { name: 'a sealed notarization', path: `/transaction/${notarization.tx_hash}`, ready: /^Este documento existía el/ },
  { name: 'the network', path: '/network', signedIn: true, ready: 'Nodos registrados · 2' },
  { name: 'the wallet with a key', path: '/wallet', signedIn: true, key: true, ready: 'Actividad' },
  { name: 'the wallet without a key', path: '/wallet', signedIn: true, ready: 'Abrir un archivo de clave' },
  { name: 'sign and send with a key', path: '/transact', signedIn: true, key: true, ready: 'Lo que estás firmando' },
  { name: 'sign and send without a key', path: '/transact', signedIn: true, ready: 'No hay clave en esta pestaña' },
  { name: 'a page that does not exist', path: '/no/such/page', ready: 'Esta página no está en la torre' },
];

describe('AR-11 every page in Spanish', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ language: 'es', theme: 'system' });
    useHealthStore.setState({ online: true, databaseDown: false, demoMode: true });
  });

  afterEach(() => {
    usePreferencesStore.setState({ language: 'en' });
    useAppStore.setState({ token: null, user: null });
    useKeyStore.getState().forget();
  });

  it('knows the English texts it looks for', () => {
    expect(ENGLISH).toEqual(expect.arrayContaining(['Sign and send', 'Back to the tower', 'Copy address']));
  });

  it.each(CASES)('$name shows no English text', async ({ path, signedIn, key, ready }) => {
    if (signedIn) useAppStore.setState({ token: 'abc.def.ghi' });
    if (key) useKeyStore.getState().hold({ ...generateKeyPair() }, true);
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText(ready)).toBeInTheDocument();
    // Whatever loads after the first text, such as a block's transactions, has time to arrive.
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(englishIn(shown())).toEqual([]);
  });
});
