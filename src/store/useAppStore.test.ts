import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './useAppStore';

const STORAGE_KEY = 'veriledger-storage';

function persistedToken() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === null ? undefined : JSON.parse(raw).state.token;
}

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ token: null });
  });

  it('starts without a session', () => {
    expect(useAppStore.getState().token).toBeNull();
  });

  it('keeps the token set at sign-in and persists it', () => {
    useAppStore.getState().setToken('abc.def.ghi');

    expect(useAppStore.getState().token).toBe('abc.def.ghi');
    expect(persistedToken()).toBe('abc.def.ghi');
  });

  it('clears the token on logout, in memory and in storage', () => {
    useAppStore.getState().setToken('abc.def.ghi');
    useAppStore.getState().logout();

    expect(useAppStore.getState().token).toBeNull();
    expect(persistedToken()).toBeNull();
  });

  it('restores a persisted session, as after a page reload', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { token: 'from.a.reload' }, version: 0 }));

    await useAppStore.persist.rehydrate();

    expect(useAppStore.getState().token).toBe('from.a.reload');
  });
});
