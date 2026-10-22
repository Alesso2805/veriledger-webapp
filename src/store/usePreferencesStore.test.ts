import { beforeEach, describe, expect, it } from 'vitest';
import { PREFERENCES_KEY } from '../types/preferences';
import { browserLanguage, usePreferencesStore } from './usePreferencesStore';

const stored = () => JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? 'null');

describe('usePreferencesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferencesStore.setState({ theme: 'system', language: 'en' });
  });

  it('follows the system until a theme is chosen, and keeps the choice', () => {
    expect(usePreferencesStore.getState().theme).toBe('system');
    usePreferencesStore.getState().setTheme('dark');
    expect(stored().state).toEqual({ theme: 'dark', language: 'en' });
  });

  it('keeps the chosen language with the theme', () => {
    usePreferencesStore.getState().setLanguage('es');
    expect(stored().state).toEqual({ theme: 'system', language: 'es' });
  });

  it('reads stored choices back', async () => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ state: { theme: 'light', language: 'es' }, version: 0 }));
    await usePreferencesStore.persist.rehydrate();
    expect(usePreferencesStore.getState()).toMatchObject({ theme: 'light', language: 'es' });
  });

  it.each([
    ['a theme and a language it does not know', { state: { theme: 'purple', language: 'fr' }, version: 0 }],
    ['numbers', { state: { theme: 3, language: 4 }, version: 0 }],
    ['a null state', { state: null, version: 0 }],
  ])('follows the system, in the language it had, when the storage holds %s', async (_, value) => {
    usePreferencesStore.setState({ theme: 'dark', language: 'en' });
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value));
    await usePreferencesStore.persist.rehydrate();
    expect(usePreferencesStore.getState()).toMatchObject({ theme: 'system', language: 'en' });
  });
});

describe('browserLanguage', () => {
  it('picks the first language of the browser that the app speaks, and English otherwise', () => {
    expect(browserLanguage(['es-PE', 'en'])).toBe('es');
    expect(browserLanguage(['fr-FR', 'es'])).toBe('es');
    expect(browserLanguage(['en-US', 'es'])).toBe('en');
    expect(browserLanguage(['fr'])).toBe('en');
    expect(browserLanguage([])).toBe('en');
    expect(browserLanguage(['estonian-ish'])).toBe('en');
  });
});
