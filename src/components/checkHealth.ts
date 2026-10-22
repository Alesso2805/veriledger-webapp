import { messages } from '../lib/i18n';
import { DatabaseDownError, getHealth } from '../services/health';
import { useHealthStore } from '../store/useHealthStore';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { useToastStore } from '../store/useToastStore';

export const HEALTH_POLL_MS = 10_000;

// Only the change from offline to online raises the toast, not the first answer.
export async function checkHealth() {
  const { online, setOnline, setDatabaseDown, setDemoMode } = useHealthStore.getState();
  try {
    const health = await getHealth();
    if (online === false) useToastStore.getState().show(messages(usePreferencesStore.getState().language).shell.toasts.backOnline);
    setOnline(true);
    setDatabaseDown(false);
    setDemoMode(health.demo_mode === true);
  } catch (error) {
    setOnline(false);
    setDatabaseDown(error instanceof DatabaseDownError);
  }
}
