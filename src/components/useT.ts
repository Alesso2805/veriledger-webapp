import { useEffect } from 'react';
import { messages, type Messages } from '../lib/i18n';
import { usePreferencesStore } from '../store/usePreferencesStore';
import type { Language } from '../types/preferences';

// The dictionary of the page's language (ADR-0007). Every user-facing text comes from it (AR-11).
export function useT(): Messages {
  return messages(usePreferencesStore((state) => state.language));
}

export function useLanguage(): Language {
  return usePreferencesStore((state) => state.language);
}

// <html lang> follows the page's language, so a screen reader reads it in its own voice.
export function useLanguageAttribute() {
  const language = useLanguage();
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
}
