import { Link, useLocation } from 'react-router';
import { BrokenLink } from './BrokenLink';
import { useT } from './useT';

// A page that threw while drawing (VLW-35). The shell around it still works. "Try again" draws the page again
// without a reload, which would forget a key held in this tab. "Back to the chain" leaves for another route, whose
// new <main> starts without the failure; on the chain itself only "Try again" is offered.
export function PageFailed({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  const onChain = useLocation().pathname === '/';
  return (
    <section
      role="alert"
      aria-labelledby="page-failed-title"
      className="flex animate-vl-fade-up flex-wrap items-center gap-6 rounded-[28px] bg-vl-surface p-[30px] shadow-[inset_0_0_0_2px_var(--color-vl-danger)] max-sm:p-[22px]"
    >
      <BrokenLink />
      <div className="min-w-0 flex-[1_1_260px]">
        <p className="font-vl-mono text-[13px] text-vl-danger">{t.failure.error}</p>
        <h1 id="page-failed-title" className="mt-0.5 text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em]">
          {t.failure.pageTitle}
        </h1>
        <p className="mt-2 mb-4 text-vl-muted">{t.failure.pageText}</p>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={onRetry} className="h-12 rounded-[14px] bg-vl-strong px-5 font-bold text-vl-on-strong">
            {t.failure.tryAgain}
          </button>
          {!onChain && (
            <Link
              to="/"
              className="inline-flex h-12 items-center rounded-[14px] border-[1.5px] border-vl-line px-5 font-bold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
            >
              {t.failure.backToChain}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
