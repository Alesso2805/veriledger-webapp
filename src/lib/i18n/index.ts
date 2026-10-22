import type { Language } from '../../types/preferences';
import { en, type Messages } from './en';
import { es } from './es';

export type { Messages };

const DICTIONARIES: Record<Language, Messages> = { en, es };

export function messages(language: Language): Messages {
  return DICTIONARIES[language] ?? en;
}

// The locales Intl formats with. English keeps day-month dates, as the artboards draw them.
export const DATE_LOCALE: Record<Language, string> = { en: 'en-GB', es: 'es' };
export const NUMBER_LOCALE: Record<Language, string> = { en: 'en-US', es: 'es' };
