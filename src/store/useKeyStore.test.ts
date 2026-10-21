import { beforeEach, describe, expect, it } from 'vitest';
import { useKeyStore } from './useKeyStore';

const pair = { public_key: 'ab'.repeat(32), private_key: 'cd'.repeat(32) };

describe('useKeyStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useKeyStore.setState({ pair: null, saved: false });
  });

  it('holds the pair for the tab and forgets it', () => {
    useKeyStore.getState().hold(pair, false);
    expect(useKeyStore.getState().pair).toEqual(pair);

    useKeyStore.getState().forget();
    expect(useKeyStore.getState()).toMatchObject({ pair: null, saved: false });
  });

  it('remembers whether a key file of the pair exists', () => {
    useKeyStore.getState().hold(pair, false);
    expect(useKeyStore.getState().saved).toBe(false);

    useKeyStore.getState().markSaved();
    expect(useKeyStore.getState().saved).toBe(true);

    useKeyStore.getState().hold(pair, true);
    expect(useKeyStore.getState().saved).toBe(true);
  });

  it('writes the private key to no storage at all', () => {
    useKeyStore.getState().hold(pair, false);

    const stored = [localStorage, sessionStorage].flatMap((storage) =>
      Object.keys(storage).map((key) => storage.getItem(key) ?? ''),
    );
    expect(stored.some((value) => value.includes(pair.private_key))).toBe(false);
  });
});
