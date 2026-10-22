import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LANGUAGES, PREFERENCES_KEY, THEME_PREFERENCES, type Language, type ThemePreference } from '../types/preferences';

interface PreferencesState {
  theme: ThemePreference;
  language: Language;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: Language) => void;
}

// Before any choice, the browser's languages decide, in the person's order: the first one the app speaks wins, and
// with none of them, English (ADR-0007).
export function browserLanguage(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages): Language {
  for (const language of languages) {
    if (/^es\b/i.test(language)) return 'es';
    if (/^en\b/i.test(language)) return 'en';
  }
  return 'en';
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: browserLanguage(),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: PREFERENCES_KEY,
      partialize: (state) => ({ theme: state.theme, language: state.language }),
      // Storage edited by hand can hold anything; a theme the app does not know follows the system, and a language
      // it does not know is the browser's.
      merge: (persisted, current) => {
        const stored = persisted as { theme?: unknown; language?: unknown } | null;
        return {
          ...current,
          theme: THEME_PREFERENCES.includes(stored?.theme as ThemePreference) ? (stored?.theme as ThemePreference) : 'system',
          language: LANGUAGES.includes(stored?.language as Language) ? (stored?.language as Language) : current.language,
        };
      },
    }
  )
);
