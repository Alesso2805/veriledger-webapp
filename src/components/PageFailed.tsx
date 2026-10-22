import { Link, useLocation } from 'react-router';
import { FailedTower } from './FailedTower';
import { useT } from './useT';

// A page that threw while drawing (VLW-35). The shell around it still works. "Try again" draws the page again
// without a reload, which would forget a key held in this tab. "Back to the tower" leaves for another route, whose
// new <main> starts without the failure; on the tower itself only "Try again" is offered.
export function PageFailed({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  const onTower = useLocation().pathname === '/';
  return (
    <section
      role="alert"
      aria-labelledby="page-failed-title"
      className="flex animate-vl-fade-up flex-wrap items-center gap-6 rounded-2xl border border-vl-danger bg-vl-surface p-7"
    >
      <FailedTower className="w-[170px] flex-[0_0_170px] overflow-visible" />
      <div className="min-w-0 flex-[1_1_260px]">
        <p className="font-vl-mono text-xs text-vl-danger">{t.failure.error}</p>
        <h1 id="page-failed-title" className="mt-0.5 text-[28px] font-bold tracking-[-0.02em]">
          {t.failure.pageTitle}
        </h1>
        <p className="mt-2 mb-4 text-vl-muted">
          {t.failure.pageText}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="h-[42px] rounded-[10px] bg-vl-accent px-3.5 font-semibold text-vl-on-accent"
          >
            {t.failure.tryAgain}
          </button>
          {!onTower && (
            <Link
              to="/"
              className="inline-flex h-[42px] items-center rounded-[10px] border border-vl-line px-3.5 font-semibold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
            >
              {t.failure.backToTower}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
