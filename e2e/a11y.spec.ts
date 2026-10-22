import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { before, expect, startsWith, test, type Messages } from './i18n';
import { mockApi, NOTARIZATION_HASH, TRANSFER_HASH, type Role } from './mockApi';

// VLW-24 on every page and state, at 1280 and 360 px, in the light theme in English and the dark theme in Spanish
// (VLW-48): no serious or critical axe violation, no sideways scroll, and a visible focus on every control the
// keyboard reaches.
interface Case {
  name: string;
  path: string;
  role?: Role;
  // What shows once the page has its data.
  ready: (page: Page, t: Messages) => ReturnType<Page['getByRole']>;
  // Steps that bring the page to the state being checked.
  then?: (page: Page, t: Messages) => Promise<void>;
  // The fewest controls the keyboard must reach, so the focus walk cannot pass by reaching none. The shell alone
  // has seven: the skip link, the search, the header's two buttons and the four tabs.
  controls?: number;
}

const createWallet = async (page: Page, t: Messages) => {
  await page.getByRole('button', { name: t.wallet.create }).click();
  await expect(page.getByRole('heading', { name: t.wallet.address })).toBeVisible();
};

const cases: Case[] = [
  // No shell: the two switches, email, password, "Sign in", "Try the demo" and the link to the chain.
  { name: 'login', path: '/login', ready: (page, t) => page.getByRole('heading', { name: t.login.title }), controls: 5 },
  { name: 'chain, visitor', path: '/', ready: (page, t) => page.getByRole('button', { name: startsWith(`${t.chain.list.block(11)} `) }) },
  {
    name: 'chain, trader',
    path: '/?block=11',
    role: 'trader',
    ready: (page, t) => page.getByRole('button', { name: startsWith(t.chain.mine.mineBlock(12)) }),
  },
  {
    name: 'transaction, visitor',
    path: `/transaction/${TRANSFER_HASH}`,
    ready: (page, t) => page.getByRole('heading', { name: t.transaction.details.title }),
  },
  {
    name: 'transaction, viewer',
    path: `/transaction/${TRANSFER_HASH}`,
    role: 'viewer',
    ready: (page, t) => page.getByRole('heading', { name: t.transaction.details.title }),
  },
  {
    name: 'notarization and its certificate',
    path: `/transaction/${NOTARIZATION_HASH}`,
    ready: (page, t) => page.getByRole('heading', { name: startsWith(before(t.transaction.certificate.existed)) }),
  },
  { name: 'network, visitor', path: '/network', ready: (page, t) => page.getByRole('heading', { name: t.network.list.title('2') }) },
  { name: 'network, admin', path: '/network', role: 'admin', ready: (page, t) => page.getByRole('button', { name: t.network.add.button }) },
  { name: 'not found', path: '/no/such/page', ready: (page, t) => page.getByRole('heading', { name: t.notFound.title }) },
  { name: 'wallet, no key', path: '/wallet', role: 'trader', ready: (page, t) => page.getByRole('button', { name: t.wallet.create }) },
  {
    name: 'wallet, new key',
    path: '/wallet',
    role: 'trader',
    ready: (page, t) => page.getByRole('button', { name: t.wallet.create }),
    then: createWallet,
  },
  {
    name: 'sign and send, no key',
    path: '/transact',
    role: 'trader',
    ready: (page, t) => page.getByRole('heading', { name: t.transact.noKeyTitle }),
  },
  {
    name: 'sign and send, with a key',
    path: '/wallet',
    role: 'trader',
    ready: (page, t) => page.getByRole('button', { name: t.wallet.create }),
    // The key lives only in the tab's memory, so the page is reached through the app, not a reload.
    then: async (page, t) => {
      await createWallet(page, t);
      await page.getByRole('navigation', { name: t.shell.mainNav }).getByRole('link', { name: t.shell.tabs.transact }).click();
      await expect(page.getByText(t.transact.signingAs)).toBeVisible();
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
  test(item.name, async ({ page, t, locale, colorScheme }) => {
    await mockApi(page, item.role);
    await page.goto(item.path);
    await expect(item.ready(page, t)).toBeVisible();
    // The project's language and theme reached the page, so what follows checks them.
    await expect(page.locator('html')).toHaveAttribute('lang', locale?.slice(0, 2) ?? 'en');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(colorScheme);
    await item.then?.(page, t);
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
