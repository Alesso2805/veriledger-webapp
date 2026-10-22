import type { Page } from '@playwright/test';
import { expect, literal, numbered, startsWith, test, type Messages } from './i18n';

// VLW-23: the main flows against the API's real Compose stack (`npm run test:e2e`). They read the page in English,
// with the dictionary's own words (VLW-48), so a text changed in the app is changed here too. The stack runs with
// DEMO_MODE=true, a low MINING_DIFFICULTY, the demo limits off and CORS_ORIGINS set to this preview's origin.
// E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are the admin it seeded (VLA-24); nothing here hard-codes them.
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:8000';
// Any well-formed address; nobody needs its key.
const RECEIVER = '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c';

function admin() {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to the admin the API seeded');
  return { email, password };
}

// The app reads its API from /config.json, as the image writes it (ADR-0003). The preview has none, so the flows
// give it one; a deployed image (E2E_BASE_URL) is left with its own, which says /api on the same origin.
async function pointAtApi(page: Page) {
  if (process.env.E2E_BASE_URL) return;
  await page.route('**/config.json', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ apiBaseUrl: API }) }),
  );
}

// Any Content Security Policy violation the browser reports fails the flow, even one the page survives, such as a
// blocked font. Only a deployed image sends the policy (VLW-22), so this bites in the rehearsal (VLW-25).
const violations = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const seen: string[] = [];
  violations.set(page, seen);
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) seen.push(message.text());
  });
});
test.afterEach(({ page }) => {
  expect(violations.get(page), 'Content Security Policy violations').toEqual([]);
});

// Moves through the app's own links, so the key held in the tab's memory survives.
const tab = (page: Page, t: Messages, name: keyof Messages['shell']['tabs']) =>
  page.getByRole('navigation', { name: t.shell.mainNav }).getByRole('link', { name: t.shell.tabs[name] });

// Mines and waits for the toast of the block this click sealed. Its number comes from the API's answer, not
// from the button: another miner on the same node (here, the other flow) can take the number shown first.
// That miner can also be busy, since a node mines one block at a time (429, VLA-29), or have just sealed the same
// height (409, VLA-17). The toast says so, and, as a person would, the flow waits for Retry-After and tries again.
async function mineTo(page: Page, t: Messages, address: string): Promise<number> {
  const mine = new RegExp(`^(?:${numbered(t.chain.mine.mineBlock(9999), 9999)}|${literal(t.chain.mine.mineGenesis)})$`);
  await tab(page, t, 'chain').click();
  await page.getByLabel(t.chain.mine.address, { exact: true }).fill(address);
  for (let attempt = 1; ; attempt++) {
    const [answer] = await Promise.all([
      page.waitForResponse((response) => response.url().endsWith('/blocks/mine') && response.request().method() === 'POST', {
        timeout: 60_000,
      }),
      page.getByRole('button', { name: mine }).click(),
    ]);
    if (answer.ok()) {
      const { block_number: sealed } = (await answer.json()) as { block_number: number };
      await expect(page.getByText(startsWith(t.chain.sealed(sealed, '')))).toBeVisible();
      return sealed;
    }
    expect([409, 429], `POST /blocks/mine answered ${answer.status()}`).toContain(answer.status());
    expect(attempt, 'mining attempts').toBeLessThan(10);
    await page.waitForTimeout(Number(answer.headers()['retry-after'] ?? 1) * 1000);
  }
}

// Signs what the composer holds, sends it, and returns the hash the node accepted it under.
async function signAndSend(page: Page, t: Messages): Promise<string> {
  await page.getByRole('button', { name: t.transact.sign }).click();
  await page.getByRole('button', { name: t.transact.send }).click();
  await expect(page.getByText(t.transact.accepted.title)).toBeVisible();
  const href = await page.getByRole('link', { name: t.transact.accepted.open }).getAttribute('href');
  return href!.replace('/transaction/', '');
}

test('an admin makes a wallet, mines to it, transfers and notarizes, and sees both sealed with a certificate', async ({ page, t }) => {
  test.setTimeout(180_000);
  const { email, password } = admin();
  // New bytes on every run, so the notarization is never a document the chain already holds.
  const document = { name: 'contract.txt', mimeType: 'text/plain', buffer: Buffer.from(`VeriLedger end to end, ${Date.now()}`) };
  await pointAtApi(page);

  await test.step('sign in', async () => {
    await page.goto('/login');
    await page.getByLabel(t.login.email, { exact: true }).fill(email);
    await page.getByLabel(t.login.password, { exact: true }).fill(password);
    await page.getByRole('button', { name: t.login.submit, exact: true }).click();
    await expect(page.getByRole('button', { name: t.shell.signOut })).toBeVisible();
  });

  let address = '';
  await test.step('create a wallet in the browser', async () => {
    await tab(page, t, 'wallet').click();
    await page.getByRole('button', { name: t.wallet.create }).click();
    // The address's groups follow its heading, beside the copy button.
    const groups = page.getByRole('heading', { name: t.wallet.address }).locator('xpath=following-sibling::div[1]/p');
    address = ((await groups.textContent()) ?? '').replace(/\s/g, '');
    expect(address).toMatch(/^[0-9a-f]{64}$/);
  });

  await test.step('mine a block to it', async () => {
    await mineTo(page, t, address);
  });

  let transfer = '';
  await test.step('sign and send a transfer', async () => {
    await tab(page, t, 'transact').click();
    await expect(page.getByText(t.transact.signingAs)).toBeVisible();
    await page.getByLabel(t.transact.to, { exact: true }).fill(RECEIVER);
    await page.getByLabel(t.transact.amount, { exact: true }).fill('10');
    await page.getByLabel(t.transact.fee, { exact: true }).fill('0.1');
    transfer = await signAndSend(page, t);
  });

  let notarization = '';
  await test.step('notarize a document', async () => {
    await page.getByRole('button', { name: t.transact.accepted.again }).click();
    await page.getByRole('group', { name: t.transact.kind }).getByRole('button', { name: t.transact.notarize }).click();
    await page.locator('input[type="file"]').setInputFiles(document);
    await expect(page.getByText(/^contract\.txt · SHA-256 /)).toBeVisible();
    notarization = await signAndSend(page, t);
  });

  // Whoever mines next seals what waits, so another miner's block may hold them; any block will do.
  await test.step('mine a block, which seals both', async () => {
    await mineTo(page, t, address);
  });

  const inBlock = new RegExp(`^${numbered(t.transaction.chips.sealed(9999), 9999)}$`);
  await test.step('the transfer is sealed, and its signature checks out in the browser', async () => {
    await page.goto(`/transaction/${transfer}`);
    await expect(page.getByText(inBlock).first()).toBeVisible();
    await expect(page.getByText(t.transaction.details.check.valid)).toBeVisible();
  });

  await test.step('the notarization is sealed, with a certificate the same file matches', async () => {
    await page.goto(`/transaction/${notarization}`);
    await expect(page.getByText(inBlock).first()).toBeVisible();
    await expect(page.getByText(t.transaction.certificate.kicker)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles(document);
    await expect(page.getByText(t.transaction.certificate.match, { exact: true })).toBeVisible();
  });
});

test('a visitor tries the demo with one click and mines with it', async ({ page, t }) => {
  test.setTimeout(90_000);
  await pointAtApi(page);

  await page.goto('/login');
  await page.getByRole('button', { name: t.login.demoButton }).click();

  // The guest's name is the API's (its display_name); what follows it is the app's.
  await expect(page.getByText(/^Guest [0-9A-F]{4}$/)).toBeVisible();
  await expect(page.getByText(new RegExp(`^${numbered(t.shell.demoChip(t.shell.hoursLeft(9999)), 9999)}$`))).toBeVisible();
  await mineTo(page, t, 'e'.repeat(64));
});
