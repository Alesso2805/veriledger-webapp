import { getHealth } from '../services/health';
import { useHealthStore } from '../store/useHealthStore';
import { useToastStore } from '../store/useToastStore';

export const HEALTH_POLL_MS = 10_000;

// Asks /health once. Only the change from offline to online raises the toast, not the first answer.
export async function checkHealth() {
  const { online, setOnline, setDemoMode } = useHealthStore.getState();
  try {
    const health = await getHealth();
    if (online === false) useToastStore.getState().show('Back online.');
    setOnline(true);
    setDemoMode(health.demo_mode === true);
  } catch {
    setOnline(false);
  }
}
