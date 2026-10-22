import { healthWord } from '../lib/format';
import { useHealthStore } from '../store/useHealthStore';
import { useT } from './useT';

export function HealthStatus() {
  const t = useT();
  const online = useHealthStore((state) => state.online);
  const databaseDown = useHealthStore((state) => state.databaseDown);
  const dot = online === null ? 'fill-vl-faint' : online ? 'fill-vl-ok' : 'fill-vl-danger';

  return (
    <span role="status" className="flex items-center gap-1.5 font-vl-mono text-[11px] text-vl-muted sm:gap-2 sm:text-xs">
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
        <circle cx="4" cy="4" r="4" className={`${dot} transition-colors duration-(--vl-dur-base)`} />
      </svg>
      <span className="hidden sm:inline">{t.shell.api}</span>
      {t.shell.health[healthWord(online, databaseDown)]}
    </span>
  );
}
