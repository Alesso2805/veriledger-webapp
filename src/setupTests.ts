import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, expect } from 'vitest';

// Testing Library only unmounts on its own when Vitest globals are enabled; they are not.
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// VLW-24: axe on what a component test rendered, for the states a browser run hardly reaches (refusals, empty
// lists, not found). jsdom has no layout, so colour contrast is left to `npm run test:a11y` in a real browser.
expect.extend({
  async toPassAxe(received: Element) {
    const results = await axe.run(received, { rules: { 'color-contrast': { enabled: false } } });
    const serious = results.violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
      .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`);
    return {
      pass: serious.length === 0,
      message: () => (serious.length ? `serious or critical axe violations:\n${serious.join('\n')}` : 'no serious or critical axe violation'),
    };
  },
});

// Vitest's extension point for custom matchers; its type parameters must be repeated exactly.
declare module 'vitest' {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> {
    toPassAxe: () => Promise<void>;
  }
}
