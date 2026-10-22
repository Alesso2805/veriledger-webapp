import { usePreferencesStore } from '../store/usePreferencesStore';
import { useT } from './useT';

// The navbar's language switch (DESIGN.md › Languages): it shows the current language, and its label says it in that
// language and offers the other.
export function LanguageSwitch({ className = 'bg-vl-surface' }: { className?: string }) {
  const t = useT();
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  return (
    <button
      type="button"
      onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
      aria-label={t.shell.language.label}
      title={t.shell.language.label}
      className={`grid size-10 shrink-0 place-items-center rounded-xl font-vl-mono text-[13px] font-bold text-vl-text transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised ${className}`}
    >
      {t.shell.language.code}
    </button>
  );
}
