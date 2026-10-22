import { messages } from '../lib/i18n';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { BrokenLink } from './BrokenLink';
import { LogoMark } from './LogoMark';

// The stored language, read without a hook: whatever broke may have been a hook.
function texts() {
  try {
    return messages(usePreferencesStore.getState().language).failure;
  } catch {
    return messages('en').failure;
  }
}

// The shell or the login threw while drawing, so nothing around this can be trusted: it works without a router, a
// store hook or the API, and offers the one thing that helps, a reload. public/theme.js has already set the theme.
export function AppFailed({ onReload = () => window.location.reload() }: { onReload?: () => void }) {
  const t = texts();
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-base leading-normal">
      <section
        role="alert"
        aria-labelledby="app-failed-title"
        className="w-full max-w-[560px] animate-vl-fade-up rounded-[28px] bg-vl-surface p-7 shadow-[inset_0_0_0_2px_var(--color-vl-danger)]"
      >
        <span className="flex items-center gap-2.5">
          <LogoMark size={26} />
          <span className="font-extrabold">VeriLedger</span>
        </span>
        <BrokenLink className="my-5" />
        <p className="font-vl-mono text-xs text-vl-danger">{t.error}</p>
        <h1 id="app-failed-title" className="mt-0.5 text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em]">
          {t.appTitle}
        </h1>
        <p className="mt-1.5 mb-4 text-[15px] text-vl-muted">{t.appText}</p>
        <button type="button" onClick={onReload} className="h-11 rounded-xl bg-vl-strong px-4 text-[15px] font-bold text-vl-on-strong">
          {t.reload}
        </button>
      </section>
    </main>
  );
}
