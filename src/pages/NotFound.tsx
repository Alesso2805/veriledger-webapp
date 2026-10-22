import { Link } from 'react-router';
import { Fingerprint } from '../components/Fingerprint';
import { useT } from '../components/useT';

const Connector = () => (
  <svg width="28" height="12" viewBox="0 0 28 12" className="shrink-0">
    <path d="M2 6h24" strokeWidth="2.5" strokeDasharray="2 5" strokeLinecap="round" className="stroke-vl-faint" />
  </svg>
);

// A link of the chain with its middle tile missing (DESIGN.md › Not found). The fingerprints are a drawing, not data.
export function NotFound() {
  const t = useT();
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex flex-wrap items-center gap-x-10 gap-y-7 rounded-[28px] bg-vl-surface p-9 max-sm:p-[22px]"
    >
      <div aria-hidden="true" className="flex max-w-[460px] min-w-0 flex-[1_1_320px] items-center">
        <span className="min-w-0 flex-1 rounded-2xl bg-vl-bg p-3">
          <Fingerprint hex="9657f8d2c4e1a07b" bars={8} className="h-[30px] gap-[2px]" radius={3} />
        </span>
        <Connector />
        <span
          className="min-w-0 flex-1 animate-vl-tile-in rounded-2xl border-2 border-dashed border-vl-accent p-3"
          style={{ animationDelay: '200ms' }}
        >
          <Fingerprint hex="" bars={8} className="h-[26px] gap-[2px]" radius={3} />
        </span>
        <Connector />
        <span className="min-w-0 flex-1 rounded-2xl bg-vl-bg p-3">
          <Fingerprint hex="a3f19c7e52b8d04f" bars={8} className="h-[30px] gap-[2px]" radius={3} />
        </span>
      </div>
      <div className="min-w-0 flex-[1_1_300px]">
        <p className="font-vl-mono text-[13px] text-vl-accent">404</p>
        <h1 id="not-found-title" className="mt-1 text-[44px] leading-[1.05] font-extrabold tracking-[-0.035em] max-sm:text-[32px]">
          {t.notFound.title}
        </h1>
        <p className="mt-3 mb-5 max-w-[480px] text-[17px] text-vl-muted">{t.notFound.text}</p>
        <Link
          to="/"
          className="inline-flex h-[52px] items-center rounded-2xl bg-vl-strong px-6 font-bold text-vl-on-strong"
        >
          {t.notFound.back}
        </Link>
      </div>
    </section>
  );
}
