import { messages } from '../lib/i18n';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { FailedTower } from './FailedTower';
import { LogoMark } from './LogoMark';

// The stored language, read without a hook: whatever broke may have been a hook.
function texts() {
  try {
    return messages(usePreferencesStore.getState().language).failure;
  } catch {
    return messages('en').failure;
  }
}

// The shell or the login threw while drawing (VLW-35), so nothing around this can be trusted: it needs no router,
// store or API, and offers the one thing that helps, a reload.
export function AppFailed({ onReload = () => window.location.reload() }: { onReload?: () => void }) {
  const t = texts();
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-[15px] leading-normal">
      <section
        role="alert"
        aria-labelledby="app-failed-title"
        className="w-full max-w-[560px] animate-vl-fade-up rounded-2xl border border-vl-danger bg-vl-surface p-7"
      >
        <span className="flex items-center gap-2.5">
          <LogoMark className="size-[26px]" />
          <span className="text-lg font-bold">veriledger</span>
        </span>
        <FailedTower className="mx-auto my-5 block w-[150px] overflow-visible" />
        <p className="font-vl-mono text-xs text-vl-danger">{t.error}</p>
        <h1 id="app-failed-title" className="mt-0.5 text-[28px] font-bold tracking-[-0.02em]">
          {t.appTitle}
        </h1>
        <p className="mt-2 mb-4 text-vl-muted">
          {t.appText}
        </p>
        <button
          type="button"
          onClick={onReload}
          className="h-[42px] rounded-[10px] bg-vl-accent px-3.5 font-semibold text-vl-on-accent"
        >
          {t.reload}
        </button>
      </section>
    </main>
  );
}
