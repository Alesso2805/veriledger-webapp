import { useToastStore, type ToastKind } from '../store/useToastStore';

const DOT: Record<ToastKind, string> = { ok: 'fill-vl-ok', err: 'fill-vl-danger', info: 'fill-vl-muted' };
const BORDER: Record<ToastKind, string> = { ok: 'border-vl-line', err: 'border-vl-danger', info: 'border-vl-line' };

export function ToastRegion() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    // One live region that exists before any toast, so each new toast is announced once.
    <section
      aria-label="Notifications"
      aria-live="polite"
      className="fixed right-5 bottom-5 z-50 flex max-w-[calc(100vw-40px)] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex animate-vl-toast-in items-center gap-2.5 rounded-xl border bg-vl-raised px-3.5 py-3 text-sm ${BORDER[toast.kind]}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
            <circle cx="8" cy="8" r="8" className={DOT[toast.kind]} />
            {toast.kind === 'ok' && (
              <path d="M4.5 8.5l2.2 2.2L11.5 6" fill="none" strokeWidth="1.8" className="stroke-vl-bg" />
            )}
          </svg>
          <span>{toast.text}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismiss(toast.id)}
            className="size-7 shrink-0 rounded-md text-base font-medium text-vl-muted transition-colors duration-(--vl-dur-fast) hover:text-vl-text"
          >
            ×
          </button>
        </div>
      ))}
    </section>
  );
}
