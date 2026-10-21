import { useEffect, useState } from 'react';
import { getHealth } from '../services/health';

const POLL_MS = 10_000;

export function HealthStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const check = () =>
      getHealth().then(
        () => active && setOnline(true),
        () => active && setOnline(false),
      );
    check();
    const timer = setInterval(check, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const state = online === null ? 'checking' : online ? 'online' : 'offline';
  const dot = online === null ? 'fill-vl-faint' : online ? 'fill-vl-ok' : 'fill-vl-danger';

  return (
    <span role="status" className="flex items-center gap-1.5 font-vl-mono text-[11px] text-vl-muted sm:gap-2 sm:text-xs">
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
        <circle cx="4" cy="4" r="4" className={`${dot} transition-colors duration-(--vl-dur-base)`} />
      </svg>
      <span className="hidden sm:inline">api · </span>
      {state}
    </span>
  );
}
