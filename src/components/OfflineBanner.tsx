import { apiHost } from '../services/api';
import { useHealthStore } from '../store/useHealthStore';
import { checkHealth } from './checkHealth';
import { useT } from './useT';

export function OfflineBanner() {
  const t = useT();
  const offline = useHealthStore((state) => state.online === false);
  const databaseDown = useHealthStore((state) => state.databaseDown);

  // Opens and closes through grid-template-rows (DESIGN.md › Motion map), so the content stays mounted.
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-(--vl-dur-slow) ease-vl-out ${
        offline ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="min-h-0 overflow-hidden" aria-hidden={!offline} inert={!offline}>
        <div
          role="alert"
          className="mx-3 mb-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 rounded-2xl bg-vl-danger-soft px-4 py-2.5 text-[15px] sm:mx-6 min-[1320px]:mx-auto min-[1320px]:max-w-[1272px]"
        >
          <span>
            {databaseDown ? t.shell.offline.noDatabase(apiHost()) : t.shell.offline.unreachable(apiHost())} {t.shell.offline.retrying}
          </span>
          <button
            type="button"
            onClick={() => void checkHealth()}
            className="h-10 rounded-xl bg-vl-strong px-3.5 text-sm font-bold text-vl-on-strong"
          >
            {t.shell.offline.retry}
          </button>
        </div>
      </div>
    </div>
  );
}
