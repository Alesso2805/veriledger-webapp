import { describe, expect, it } from 'vitest';

// AR-05, first half: no code asks the server to generate a key pair. The second half, that no request of the
// generate → sign → send flow carries the private key, is no-private-key-in-requests.test.tsx.
const KNOWN_VIOLATIONS: Record<string, string> = {};

const sources = import.meta.glob<string>(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('AR-05 keys are generated in the browser', () => {
  it('reads every module under src', () => {
    expect(Object.keys(sources)).toContain('../Router.tsx');
  });

  it('calls /wallets/generate only in the known violations', () => {
    const offenders = Object.entries(sources)
      .filter(([, source]) => source.includes('/wallets/generate'))
      .map(([path]) => path.replace(/^\.\.\//, 'src/'))
      .sort();

    expect(offenders).toEqual(Object.keys(KNOWN_VIOLATIONS).sort());
  });
});
