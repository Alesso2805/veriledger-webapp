import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './useAppStore';

const STORAGE_KEY = 'veriledger-storage';

function persistedToken() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === null ? undefined : JSON.parse(raw).state.token;
}

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ token: null, endedReason: null });
  });

  it('ends an expired session: clears the token and remembers why', () => {
    useAppStore.getState().setToken('abc.def.ghi');
    useAppStore.getState().expire();

    expect(useAppStore.getState()).toMatchObject({ token: null, endedReason: 'expired' });
    expect(persistedToken()).toBeNull();
  });

  it('forgets why the last session ended once the person signs in again', () => {
    useAppStore.getState().expire();
    useAppStore.getState().setToken('abc.def.ghi');

    expect(useAppStore.getState().endedReason).toBeNull();
  });

  it('forgets why the last session ended once the login has said so', () => {
    useAppStore.getState().expire();
    useAppStore.getState().clearEndedReason();

    expect(useAppStore.getState()).toMatchObject({ token: null, endedReason: null });
  });

  it('persists only the token, not why a session ended', () => {
    useAppStore.getState().expire();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state).toEqual({ token: null });
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

  it("forgets the signed-in user whenever the session changes, and never persists it", () => {
    const user = { id: '1', email: 'a@veriledger.test', role: 'viewer' as const, created_at: '', updated_at: '' };
    for (const end of [() => useAppStore.getState().logout(), () => useAppStore.getState().expire(), () => useAppStore.getState().setToken('next')]) {
      useAppStore.getState().setUser(user);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state).not.toHaveProperty('user');

      end();

      expect(useAppStore.getState().user).toBeNull();
    }
  });

  it('restores a persisted session, as after a page reload', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { token: 'from.a.reload' }, version: 0 }));

    await useAppStore.persist.rehydrate();

    expect(useAppStore.getState().token).toBe('from.a.reload');
  });
});
