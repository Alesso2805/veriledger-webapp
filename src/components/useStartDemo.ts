import { messages } from '../lib/i18n';
import { detailOf } from '../services/api';
import { startDemo } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import { usePreferencesStore } from '../store/usePreferencesStore';

// Starts a demo account and signs this tab in with it, so the visitor carries on where they are.
// `onRefused` gets the API's words, such as its 429 limits.
export function useStartDemo(onRefused: (text: string) => void) {
  const starting = useAppStore((state) => state.startingDemo);

  const start = async () => {
    const { startingDemo, setStartingDemo, setToken } = useAppStore.getState();
    if (startingDemo) return;
    setStartingDemo(true);
    try {
      setToken(await startDemo());
    } catch (error) {
      onRefused(detailOf(error, messages(usePreferencesStore.getState().language).shell.demoFailed));
    } finally {
      setStartingDemo(false);
    }
  };

  return { starting, start };
}
