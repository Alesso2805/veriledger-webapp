import { useEffect } from 'react';
import { checkHealth, HEALTH_POLL_MS } from './checkHealth';

export function HealthWatcher() {
  useEffect(() => {
    void checkHealth();
    const timer = setInterval(() => void checkHealth(), HEALTH_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  return null;
}
