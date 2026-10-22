// The person's choice of theme (ADR-0008): the system's, or one pinned in the navbar.
export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

// Where the choice is kept; public/theme.js reads the same key before the app loads.
export const PREFERENCES_KEY = 'veriledger-preferences';
