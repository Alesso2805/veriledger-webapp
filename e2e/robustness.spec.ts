import { expect, test, type Page, type Route } from '@playwright/test';
import { mockApi, TRANSFER_HASH } from './mockApi';

// VLW-36: what the audit of 2026-10-21 fuzzed by hand (#53, #54), in both projects (1280 and 360 px). Every step must
// leave the page standing: no uncaught error, and neither of VLW-35's fallbacks, which show only when something threw
// while drawing.
const ODD = ['zz', 'hello', '#', '#-1', '-1', '1e5', '0x10', '９９', '😀', ' ', '%', '<b>x</b>', 'a'.repeat(300),
  '999999999999999', '9999999999999999', 'g'.repeat(64), 'F'.repeat(64), '0'.repeat(64)];
const AMOUNTS = ['1e5', '-1', '.5', '5.', '00000000001', '99999999999', '0.123456789', '１２', 'NaN', 'Infinity', '1,5',
  '0', '0.00000001', '9999999999.99999999', ' 3 '];

// Each test walks many routes or fields, so it gets more than Playwright's 30 s.
test.describe.configure({ timeout: 120_000 });

// Returns a check for one step. Input events commit synchronously, and a frame later anything a throw drew is there.
function watch(page: Page) {
  const uncaught: string[] = [];
  page.on('pageerror', (error) => uncaught.push(error.message));
  return async (step: string) => {
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await expect.soft(page.getByRole('heading', { name: /ran into a problem/ }), `${step}: a fallback showed`).toHaveCount(0);
    expect.soft(uncaught.splice(0), `${step}: uncaught errors`).toEqual([]);
  };
}

const json = (body: unknown) => (route: Route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

for (const role of [undefined, 'trader'] as const) {
  test(`routes with odd parameters, ${role ?? 'visitor'}`, async ({ page }) => {
    const check = watch(page);
    await mockApi(page, role);
    for (const path of ['/?block=abc', '/?block=-1', '/?block=1e3', '/?block=99999999999999999999', '/?block=%25',
      '/?block=0', '/transaction/zzz', `/transaction/${'a'.repeat(3000)}`, '/transaction/%00', '/nope/deeper?x=%25',
      '/wallet', '/transact', '/network']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await check(path.slice(0, 40));
    }
  });
}

test('odd text in every field', async ({ page }) => {
  const check = watch(page);
  await mockApi(page, 'trader');
  await page.goto('/');
  for (const text of ODD) {
    await page.locator('#header-search').fill(text);
    await page.waitForLoadState('networkidle');
    await check(`search "${text.slice(0, 20)}"`);
    await page.locator('#miner').fill(text);
    await check(`reward address "${text.slice(0, 20)}"`);
  }

  await page.goto('/wallet');
  await page.getByRole('button', { name: 'Create a wallet' }).click();
  const lookUp = page.getByLabel('Address', { exact: true });
  for (const text of ODD) {
    await lookUp.fill(text);
    await check(`look-up "${text.slice(0, 20)}"`);
    await page.getByRole('button', { name: 'Show balance' }).click();
    await check(`look-up submitted "${text.slice(0, 20)}"`);
  }

  // The key lives only in the tab's memory, so Sign and send is reached through the app, not a reload.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Sign and send' }).click();
  await expect(page.getByText('Signing as')).toBeVisible();
  for (const text of ODD) {
    await page.locator('#to').fill(text);
    await check(`to "${text.slice(0, 20)}"`);
  }
  await page.locator('#to').fill('cd'.repeat(32));
  for (const text of [...AMOUNTS, ...ODD]) {
    await page.locator('#amount').fill(text);
    await check(`amount "${text.slice(0, 20)}"`);
    await page.locator('#fee').fill(text);
    await check(`fee "${text.slice(0, 20)}"`);
  }
  await page.getByRole('button', { name: 'Notarize a document' }).click();
  for (const [name, body] of [['empty.txt', ''], ['big.bin', 'x'.repeat(1_000_000)], ['emoji 😀.txt', '😀']]) {
    await page.locator('input[type=file]').setInputFiles({ name, mimeType: 'application/octet-stream', buffer: Buffer.from(body) });
    await expect(page.getByText(`${name} · SHA-256`)).toBeVisible();
    await check(`document ${name}`);
  }
});

test('odd peer addresses, admin', async ({ page }) => {
  const check = watch(page);
  await mockApi(page, 'admin');
  await page.goto('/network');
  for (const text of [...ODD, 'http://', 'https://[::1', 'ftp://node.example.org']) {
    await page.getByLabel('Peer address').fill(text);
    await page.getByRole('button', { name: 'Add peer' }).click();
    await page.waitForLoadState('networkidle');
    await check(`peer "${text.slice(0, 20)}"`);
  }
});

test('files that are not key files', async ({ page }) => {
  const check = watch(page);
  await mockApi(page, 'trader');
  for (const [name, body] of [['array.json', '[]'], ['null.json', 'null'], ['string.json', '"key"'], ['number.json', '42'],
    ['bad-hex.json', '{"private_key":"zz"}'], ['upper-case.json', `{"private_key":"${'AB'.repeat(32)}"}`],
    ['halves.json', `{"private_key":"${'11'.repeat(32)}","public_key":"${'22'.repeat(32)}"}`],
    ['object-key.json', '{"private_key":{"a":1}}'], ['binary.json', '\u0000\u0001ÿ'], ['empty.json', '']]) {
    // A reload forgets a key opened before, so each file meets the empty wallet.
    await page.goto('/wallet');
    await page.getByLabel('Choose a key file').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(body, 'latin1') });
    await expect(page.getByRole('alert').or(page.getByRole('heading', { name: /^Your address/ }))).toBeVisible();
    await check(`key file ${name}`);
  }
});

test('a stored session the app did not write', async ({ page }) => {
  const check = watch(page);
  await mockApi(page);
  for (const [label, value] of [
    ['a number', JSON.stringify({ state: { token: 123 }, version: 0 })],
    ['an object', JSON.stringify({ state: { token: { a: 1 } }, version: 0 })],
    ['text that is not a token', JSON.stringify({ state: { token: 'not-a-jwt' }, version: 0 })],
    ['a token whose middle is not base64', JSON.stringify({ state: { token: 'a.%%%.c' }, version: 0 })],
    ['storage that is not JSON', '{not json'],
    ['a null state', JSON.stringify({ state: null, version: 0 })],
  ]) {
    // Init scripts run in order, so the latest value is the one the page reads.
    await page.addInitScript((stored) => localStorage.setItem('veriledger-storage', stored), value);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await check(`stored token: ${label}`);
  }
});

test('stored preferences the app did not write', async ({ page }) => {
  const check = watch(page);
  await mockApi(page);
  for (const [label, value] of [
    ['a theme it does not know', JSON.stringify({ state: { theme: 'purple' }, version: 0 })],
    ['a theme that is an object', JSON.stringify({ state: { theme: { a: 1 } }, version: 0 })],
    ['storage that is not JSON', '{not json'],
    ['a null state', JSON.stringify({ state: null, version: 0 })],
  ]) {
    await page.addInitScript((stored) => localStorage.setItem('veriledger-preferences', stored), value);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await check(`stored preferences: ${label}`);
  }
});

test('answers of the wrong shape from the API and config.json', async ({ context }) => {
  const scenarios: [string, string, [string, (route: Route) => Promise<void>][]][] = [
    // No engine parses an unclosed bracket; a space in the host, Chromium does.
    ['an apiBaseUrl that is not a URL', '/', [['**/config.json', json({ apiBaseUrl: 'http://[::1/api' })]]],
    ['a block whose time is not a date', '/', [['**/api/blocks?*', json({ items: [{ id: 'x', block_number: 0, previous_hash: '0',
      timestamp: 'not a date', nonce: 1, block_hash: `0000${'ab'.repeat(30)}`, transaction_ids: [], transaction_hashes: [] }], total: 1, page: 1, size: 10 })]]],
    ['a transaction with an unreadable time and amount', `/transaction/${TRANSFER_HASH}`, [[`**/api/transactions/${TRANSFER_HASH}`, json({
      id: 't', sender_address: 'ab'.repeat(32), receiver_address: 'cd'.repeat(32), amount: 1e10, fee: 0, status: 'PENDING',
      timestamp: 'not a date', signature: 'ef'.repeat(64), tx_hash: TRANSFER_HASH, payload: null, nonce: 1, block_number: null, block_hash: null })]]],
    ['a demo whose end is not a date', '/', [['**/api/auth/me', json({ id: 'u', display_name: 'Guest X', role: 'trader', email: null, expires_at: 'soon' })]]],
    ['blocks answered by a web page', '/', [['**/api/blocks?*', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html></html>' })]]],
    ['peers that are not a list', '/network', [['**/api/nodes', json({ peers: [] })]]],
    ['a balance that is not a number', '/wallet', [['**/api/wallets/*/balance', json({ balance: 'lots' })]]],
  ];
  for (const [label, path, overrides] of scenarios) {
    const page = await context.newPage();
    const check = watch(page);
    await mockApi(page, 'trader');
    // Routes added later are tried first, so these replace the fixtures' answers.
    for (const [pattern, handler] of overrides) await page.route(pattern, handler);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    if (path === '/wallet') await page.getByRole('button', { name: 'Create a wallet' }).click();
    await check(label);
    await page.close();
  }

  const page = await context.newPage();
  const check = watch(page);
  await mockApi(page);
  await page.route('**/api/auth/login', json({}));
  await page.goto('/login');
  await page.getByLabel('Email').fill('someone@veriledger.com');
  await page.getByLabel('Password').fill('whatever');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('The API did not answer. Check that it is running and try again.')).toBeVisible();
  await check('a sign-in answered without a token');
});
