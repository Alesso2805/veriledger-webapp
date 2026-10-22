import { ON_INK } from '../lib/fingerprint';
import { useToastStore, type ToastKind } from '../store/useToastStore';
import { useT } from './useT';

// Toasts are ink cards in both themes, so their dots are the palette's marks on ink (DESIGN.md › Tokens and motion).
const DOT: Record<ToastKind, string> = { ok: ON_INK.ok, err: ON_INK.refused, info: ON_INK.info };

export function ToastRegion() {
  const t = useT();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    // One live region that exists before any toast, so each new toast is announced once.
    <section
      aria-label={t.shell.toasts.region}
      aria-live="polite"
      className="fixed right-5 bottom-5 z-50 flex max-w-[calc(100vw-40px)] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex animate-vl-toast-in items-center gap-2.5 rounded-2xl bg-vl-ink py-2.5 pr-2.5 pl-4 text-[15px] text-vl-on-ink shadow-[0_12px_32px_var(--color-vl-shadow)]"
        >
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: DOT[toast.kind] }} />
          <span>{toast.text}</span>
          <button
            type="button"
            aria-label={t.shell.toasts.dismiss}
            onClick={() => dismiss(toast.id)}
            className="size-8 shrink-0 rounded-lg text-lg font-medium text-vl-on-ink transition-colors duration-(--vl-dur-fast) hover:bg-vl-ink-raised"
          >
            ×
          </button>
        </div>
      ))}
    </section>
  );
}
