import { test as base } from '@playwright/test';
import { en, type Messages } from '../src/lib/i18n/en';
import { es } from '../src/lib/i18n/es';

// The texts of the project's language, from the app's own dictionaries, so a spec finds each control by the words
// the page draws in it (VLW-48). The projects set the language as the browser's (`locale`), as a visitor's would be.
export const test = base.extend<{ t: Messages }>({
  // Playwright calls this argument `use`; another name keeps the React hooks lint from taking it for React's `use`.
  t: async ({ locale }, provide) => {
    await provide(locale?.startsWith('es') ? es : en);
  },
});

export { expect } from '@playwright/test';
export type { Messages };

// A dictionary's text as a pattern that matches it literally.
export const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A pattern for a text at the start of a name.
export const startsWith = (text: string) => new RegExp(`^${literal(text)}`);

// A text with any number where the sample number stands: `numbered(t.chain.mine.mineBlock(9999), 9999)`.
export const numbered = (text: string, sample: number) => literal(text).replace(String(sample), '\\d+');

// The words before a text's first value: "This document existed on " of `existed(day, time)`.
export const before = (text: (...values: string[]) => string) => text('\u0000', '\u0000').split('\u0000')[0];
