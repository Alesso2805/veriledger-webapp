import { describe, expect, it } from 'vitest';

// AR-07: no module under src hard-codes an absolute URL; the API base URL comes from runtime configuration.
const ALLOWED_URLS = ['http://www.w3.org/2000/svg'];

// Debt that exists today, each entry removed by the story that fixes it. A fixed entry fails until removed.
const KNOWN_VIOLATIONS: Record<string, string> = {
  'src/services/api.ts': 'VLW-21',
};

const sources = import.meta.glob<string>(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

function absoluteUrls(source: string) {
  // A placeholder shows the user what to type; it is never requested.
  const code = source.replace(/placeholder="[^"]*"/g, '');
  return [...code.matchAll(/https?:\/\/[^\s'"`<>)]+/g)]
    .map((match) => match[0])
    .filter((url) => !ALLOWED_URLS.includes(url));
}

describe('AR-07 no absolute URLs', () => {
  it('reads every module under src', () => {
    expect(Object.keys(sources)).toContain('../Router.tsx');
  });

  it('finds absolute URLs only in the known violations', () => {
    const offenders = Object.entries(sources)
      .filter(([, source]) => absoluteUrls(source).length > 0)
      .map(([path]) => path.replace(/^\.\.\//, 'src/'))
      .sort();

    expect(offenders).toEqual(Object.keys(KNOWN_VIOLATIONS).sort());
  });
});
