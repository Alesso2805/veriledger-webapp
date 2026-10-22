import { useEffect } from 'react';
import { usePreferencesStore } from '../store/usePreferencesStore';

// Keeps <html data-theme> on the person's choice after public/theme.js set it at load. With System the attribute
// goes, and the stylesheet follows the system's preference as it changes (ADR-0008).
export function useThemeAttribute() {
  const theme = usePreferencesStore((state) => state.theme);
  useEffect(() => {
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
}
