import { beforeEach, describe, expect, it } from 'vitest';
import { useKeyStore } from './useKeyStore';

const pair = { public_key: 'ab'.repeat(32), private_key: 'cd'.repeat(32) };

describe('useKeyStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useKeyStore.setState({ pair: null });
  });

  it('holds the pair for the tab and forgets it', () => {
    useKeyStore.getState().hold(pair);
    expect(useKeyStore.getState().pair).toEqual(pair);

    useKeyStore.getState().forget();
    expect(useKeyStore.getState().pair).toBeNull();
  });

  it('writes the private key to no storage at all', () => {
    useKeyStore.getState().hold(pair);

    const stored = [localStorage, sessionStorage].flatMap((storage) =>
      Object.keys(storage).map((key) => storage.getItem(key) ?? ''),
    );
    expect(stored.some((value) => value.includes(pair.private_key))).toBe(false);
  });
});
