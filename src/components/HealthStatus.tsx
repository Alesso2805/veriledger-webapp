import { healthWord } from '../lib/format';
import { useHealthStore } from '../store/useHealthStore';
import { useT } from './useT';

export function HealthStatus() {
  const t = useT();
  const online = useHealthStore((state) => state.online);
  const databaseDown = useHealthStore((state) => state.databaseDown);
  const dot = online === null ? 'bg-vl-faint' : online ? 'bg-vl-ok' : 'bg-vl-danger';

  return (
    <span role="status" className="flex items-center gap-2 font-vl-mono text-[13px] whitespace-nowrap text-vl-muted">
      <span aria-hidden="true" className={`size-[9px] rounded-full transition-colors duration-(--vl-dur-base) ${dot}`} />
      <span className="max-sm:hidden">{t.shell.api}</span>
      {t.shell.health[healthWord(online, databaseDown)]}
    </span>
  );
}
