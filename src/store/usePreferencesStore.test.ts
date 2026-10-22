import { beforeEach, describe, expect, it } from 'vitest';
import { PREFERENCES_KEY } from '../types/preferences';
import { usePreferencesStore } from './usePreferencesStore';

const stored = () => JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? 'null');

describe('usePreferencesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferencesStore.setState({ theme: 'system' });
  });

  it('follows the system until a theme is chosen, and keeps the choice', () => {
    expect(usePreferencesStore.getState().theme).toBe('system');
    usePreferencesStore.getState().setTheme('dark');
    expect(stored().state).toEqual({ theme: 'dark' });
  });

  it('reads a stored choice back', async () => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ state: { theme: 'light' }, version: 0 }));
    await usePreferencesStore.persist.rehydrate();
    expect(usePreferencesStore.getState().theme).toBe('light');
  });

  it.each([
    ['a theme it does not know', { state: { theme: 'purple' }, version: 0 }],
    ['a number', { state: { theme: 3 }, version: 0 }],
    ['a null state', { state: null, version: 0 }],
  ])('follows the system when the storage holds %s', async (_, value) => {
    usePreferencesStore.setState({ theme: 'dark' });
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value));
    await usePreferencesStore.persist.rehydrate();
    expect(usePreferencesStore.getState().theme).toBe('system');
  });
});
