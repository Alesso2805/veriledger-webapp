import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mockApi, NOTARIZATION_HASH, TRANSFER_HASH, type Role } from './mockApi';

// VLW-24 on every page and state, in both projects (1280 and 360 px): no serious or critical axe violation, no
// sideways scroll, and a visible focus on every control the keyboard reaches.
interface Case {
  name: string;
  path: string;
  role?: Role;
  // What shows once the page has its data.
  ready: (page: Page) => ReturnType<Page['getByRole']>;
  // Steps that bring the page to the state being checked.
  then?: (page: Page) => Promise<void>;
  // The fewest controls the keyboard must reach, so the focus walk cannot pass by reaching none. The shell alone
  // has seven: the skip link, the search, the header's two buttons and the four tabs.
  controls?: number;
}

const createWallet = async (page: Page) => {
  await page.getByRole('button', { name: 'Create a wallet' }).click();
  await expect(page.getByText('Your address')).toBeVisible();
};

const cases: Case[] = [
  // No shell: the two switches, email, password, "Sign in", "Try the demo" and the link to the chain.
  { name: 'login', path: '/login', ready: (page) => page.getByRole('heading', { name: 'Sign in' }), controls: 5 },
  { name: 'chain, visitor', path: '/', ready: (page) => page.getByRole('button', { name: /^Block #11 / }) },
  { name: 'chain, trader', path: '/?block=11', role: 'trader', ready: (page) => page.getByRole('button', { name: /^Mine block #12/ }) },
  { name: 'transaction, visitor', path: `/transaction/${TRANSFER_HASH}`, ready: (page) => page.getByRole('heading', { name: 'Details' }) },
  { name: 'transaction, viewer', path: `/transaction/${TRANSFER_HASH}`, role: 'viewer', ready: (page) => page.getByRole('heading', { name: 'Details' }) },
  {
    name: 'notarization and its certificate',
    path: `/transaction/${NOTARIZATION_HASH}`,
    ready: (page) => page.getByRole('heading', { name: /^This document existed on / }),
  },
  { name: 'network, visitor', path: '/network', ready: (page) => page.getByRole('heading', { name: 'Registered peers · 2' }) },
  { name: 'network, admin', path: '/network', role: 'admin', ready: (page) => page.getByRole('button', { name: 'Add peer' }) },
  { name: 'not found', path: '/no/such/page', ready: (page) => page.getByRole('heading', { name: 'This page is not on the chain' }) },
  { name: 'wallet, no key', path: '/wallet', role: 'trader', ready: (page) => page.getByRole('button', { name: 'Create a wallet' }) },
  {
    name: 'wallet, new key',
    path: '/wallet',
    role: 'trader',
    ready: (page) => page.getByRole('button', { name: 'Create a wallet' }),
    then: createWallet,
  },
  { name: 'sign and send, no key', path: '/transact', role: 'trader', ready: (page) => page.getByRole('heading', { name: 'No key in this tab' }) },
  {
    name: 'sign and send, with a key',
    path: '/wallet',
    role: 'trader',
    ready: (page) => page.getByRole('button', { name: 'Create a wallet' }),
    // The key lives only in the tab's memory, so the page is reached through the app, not a reload.
    then: async (page) => {
      await createWallet(page);
      await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Sign and send' }).click();
      await expect(page.getByText('Signing as')).toBeVisible();
    },
  },
];

// Tabs from the top of the page and returns every control whose focus cannot be seen: no outline, or an outline on
// something too small to see, such as a visually hidden file input, unless its label shows the focus instead.
async function tabThrough(page: Page): Promise<{ reached: number; missing: string[] }> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  const missing: string[] = [];
  let reached = 0;
  for (let step = 0; step < 120; step++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body) return null;
      if (element.dataset.tabbed) return { done: true as const };
      element.dataset.tabbed = 'yes';
      const outlined = (target: Element | null) => {
        if (!target) return false;
        const style = getComputedStyle(target);
        return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      };
      const box = element.getBoundingClientRect();
      const label = element.id ? document.querySelector(`label[for="${element.id}"]`) : element.closest('label');
      const visible = (outlined(element) && box.width >= 8 && box.height >= 8) || outlined(label);
      const name = element.getAttribute('aria-label') ?? (element.textContent?.trim() || label?.textContent?.trim() || element.tagName);
      return { done: false as const, visible, name: `${element.tagName.toLowerCase()} "${name.slice(0, 40)}"` };
    });
    if (!focused || focused.done) break;
    reached += 1;
    if (!focused.visible) missing.push(focused.name);
  }
  return { reached, missing };
}

for (const item of cases) {
  test(item.name, async ({ page }) => {
    await mockApi(page, item.role);
    await page.goto(item.path);
    await expect(item.ready(page)).toBeVisible();
    await item.then?.(page);
    await page.waitForLoadState('networkidle');

    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = axe.violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
      .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`);
    expect.soft(serious, 'serious or critical axe violations').toEqual([]);

    const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect.soft(width.scroll, 'no sideways scroll').toBeLessThanOrEqual(width.client);

    const tabbing = await tabThrough(page);
    expect(tabbing.reached, 'controls the keyboard reached').toBeGreaterThanOrEqual(item.controls ?? 7);
    expect.soft(tabbing.missing, 'controls whose focus is not visible').toEqual([]);
  });
}
