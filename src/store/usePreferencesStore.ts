import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PREFERENCES_KEY, THEME_PREFERENCES, type ThemePreference } from '../types/preferences';

interface PreferencesState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: PREFERENCES_KEY,
      partialize: (state) => ({ theme: state.theme }),
      // Storage edited by hand can hold anything; a theme the app does not know follows the system.
      merge: (persisted, current) => {
        const theme = (persisted as { theme?: unknown } | null)?.theme;
        return { ...current, theme: THEME_PREFERENCES.includes(theme as ThemePreference) ? (theme as ThemePreference) : 'system' };
      },
    }
  )
);
