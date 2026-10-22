import { Monitor, Moon, Sun } from 'lucide-react';
import { usePreferencesStore } from '../store/usePreferencesStore';
import type { ThemePreference } from '../types/preferences';
import { useT } from './useT';

const NEXT: Record<ThemePreference, ThemePreference> = { system: 'light', light: 'dark', dark: 'system' };
const ICONS = { system: Monitor, light: Sun, dark: Moon };

// The navbar's theme switch (DESIGN.md › Themes): it cycles System → Light → Dark, and says the choice in words.
export function ThemeSwitch({ className = 'bg-vl-surface' }: { className?: string }) {
  const t = useT();
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const Icon = ICONS[theme];
  const names = t.shell.theme.names;
  const label = t.shell.theme.label(names[theme], names[NEXT[theme]]);
  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={label}
      title={label}
      className={`grid size-10 shrink-0 place-items-center rounded-xl text-vl-text transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised ${className}`}
    >
      <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
    </button>
  );
}
