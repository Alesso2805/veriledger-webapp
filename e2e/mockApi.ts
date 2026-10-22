import { readFileSync } from 'node:fs';
import type { Page, Route } from '@playwright/test';

// The API as the pages see it, answered from fixtures with the shapes of src/types/api.ts. The confirmed transfer
// is the API's own "transfer" vector, so the transaction page verifies its signature as it would for real.
const vectors = JSON.parse(readFileSync(new URL('../src/lib/__fixtures__/signing-vectors.json', import.meta.url), 'utf8'));
const transfer = vectors.vectors.find((vector: { name: string }) => vector.name === 'transfer');
const notarization = vectors.vectors.find((vector: { name: string }) => vector.name === 'notarization');

export const ADDRESS: string = transfer.public_key;
const OTHER: string = transfer.fields.receiver_address;
const TOP = 11;

const time = (minute: number) => new Date(Date.UTC(2026, 9, 21, 12, minute)).toISOString();
// A sealed hash: the proof of work's four zeros, then hex that changes from block to block, as a real chain's does.
const blockHash = (n: number) =>
  `0000${Array.from({ length: 60 }, (_, i) => ((n * 2654435761 + i * 40503) >>> (i % 24)) % 16)
    .map((digit) => digit.toString(16))
    .join('')}`;
const rewardHash = (n: number) => `c0${n.toString(16).padStart(62, '0')}`;
export const TRANSFER_HASH = 'b1'.repeat(32);
export const NOTARIZATION_HASH = 'e0'.repeat(32);
const NOTARIZED = 9;

const reward = (n: number) => ({
  id: `r${n}`,
  sender_address: 'SYSTEM',
  receiver_address: n === TOP ? ADDRESS : OTHER,
  amount: 50,
  fee: 0,
  status: 'CONFIRMED',
  timestamp: time(n),
  signature: '',
  tx_hash: rewardHash(n),
  payload: null,
  nonce: n,
  block_id: `b${n}`,
  block_number: n,
  block_hash: blockHash(n),
});

const sealedTransfer = {
  id: 't1',
  sender_address: transfer.fields.sender_address,
  receiver_address: transfer.fields.receiver_address,
  amount: 10,
  fee: 0,
  status: 'CONFIRMED',
  timestamp: time(TOP),
  signature: transfer.signature,
  tx_hash: TRANSFER_HASH,
  payload: null,
  nonce: transfer.fields.nonce,
  block_id: `b${TOP}`,
  block_number: TOP,
  block_hash: blockHash(TOP),
};

// The API's "notarization" vector, sealed in block #9, so the certificate is drawn on ink.
const sealedNotarization = {
  ...sealedTransfer,
  id: 't3',
  sender_address: notarization.fields.sender_address,
  receiver_address: notarization.fields.receiver_address,
  amount: 0,
  timestamp: time(NOTARIZED),
  signature: notarization.signature,
  tx_hash: NOTARIZATION_HASH,
  payload: notarization.fields.payload,
  nonce: notarization.fields.nonce,
  block_id: `b${NOTARIZED}`,
  block_number: NOTARIZED,
  block_hash: blockHash(NOTARIZED),
};

const waiting = { ...sealedTransfer, id: 't2', status: 'PENDING', tx_hash: 'b2'.repeat(32), nonce: 2, block_id: null, block_number: null, block_hash: null };

const blockTransactions = (n: number) =>
  n === TOP ? [reward(n), sealedTransfer] : n === NOTARIZED ? [reward(n), sealedNotarization] : [reward(n)];
const block = (n: number) => ({
  id: `b${n}`,
  block_number: n,
  previous_hash: n === 0 ? '0'.repeat(64) : blockHash(n - 1),
  timestamp: time(n),
  nonce: 1000 + n,
  block_hash: blockHash(n),
  transaction_ids: blockTransactions(n).map((tx) => tx.id),
  transaction_hashes: blockTransactions(n).map((tx) => tx.tx_hash),
});
const blocks = Array.from({ length: TOP + 1 }, (_, index) => block(TOP - index));
const page = <T>(items: T[], skip: number, limit: number) => ({ items: items.slice(skip, skip + limit), total: items.length, page: 1, size: limit });

export type Role = 'admin' | 'trader' | 'viewer';

const user = (role: Role) => ({
  id: 'u1',
  email: `${role}@veriledger.test`,
  display_name: `${role}@veriledger.test`,
  role,
  expires_at: null,
  created_at: time(0),
  updated_at: time(0),
});

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const TOKEN = `${base64url({ alg: 'HS256' })}.${base64url({ sub: 'u1', exp: 4_102_444_800 })}.signature`;

function answer(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

// Serves /config.json and /api/* for one page. With a role, the tab starts signed in.
export async function mockApi(target: Page, role?: Role) {
  await target.route('**/config.json', (route) => answer(route, { apiBaseUrl: '/api' }));
  await target.route('**/api/**', (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, '');
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 10);
    if (path === '/health') return answer(route, { status: 'ok', environment: 'test', demo_mode: true, database: 'ok' });
    if (path === '/auth/me') return role ? answer(route, user(role)) : answer(route, { detail: 'Not authenticated' }, 401);
    if (path === '/blocks') return answer(route, page(blocks, skip, limit));
    const blockMatch = /^\/blocks\/([0-9a-f]{64})$/.exec(path);
    if (blockMatch) {
      const found = blocks.find((b) => b.block_hash === blockMatch[1]);
      if (!found) return answer(route, { detail: 'Block not found' }, 404);
      const { transaction_ids: _ids, transaction_hashes: _hashes, ...rest } = found;
      return answer(route, { ...rest, transactions: blockTransactions(found.block_number) });
    }
    if (path === '/transactions') return answer(route, page([waiting], skip, limit));
    const txMatch = /^\/transactions\/([0-9a-f]{64})$/.exec(path);
    if (txMatch) {
      const found = [sealedTransfer, sealedNotarization, waiting, ...blocks.map((b) => reward(b.block_number))].find((tx) => tx.tx_hash === txMatch[1]);
      return found ? answer(route, found) : answer(route, { detail: 'Transaction not found' }, 404);
    }
    const walletMatch = /^\/wallets\/([0-9a-f]{64})\/(balance|nonce|transactions)$/.exec(path);
    if (walletMatch) {
      const [, address, what] = walletMatch;
      if (what === 'balance') return answer(route, { address, balance: address === ADDRESS ? 40 : 0 });
      if (what === 'nonce') return answer(route, { address, nonce: address === ADDRESS ? 2 : 1 });
      return answer(route, page(address === ADDRESS ? [waiting, sealedTransfer, reward(TOP)] : [], skip, limit));
    }
    if (path === '/nodes') {
      return answer(route, [
        { id: 'n1', url: 'https://node-b.example.org', status: 'ACTIVE' },
        { id: 'n2', url: 'http://10.0.0.5:8000', status: 'ACTIVE' },
      ]);
    }
    return answer(route, { detail: `Not in the fixtures: ${route.request().method()} ${path}` }, 501);
  });
  if (role) {
    await target.addInitScript((token) => {
      localStorage.setItem('veriledger-storage', JSON.stringify({ state: { token }, version: 0 }));
    }, TOKEN);
  }
}
