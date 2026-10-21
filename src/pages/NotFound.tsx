import { Link } from 'react-router';

export function NotFound() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex flex-wrap items-center gap-6 rounded-2xl border border-vl-line bg-vl-surface p-7"
    >
      {/* A tower with its top cube missing: the dashed cube floats where it should be. */}
      <svg viewBox="0 0 200 220" aria-hidden="true" className="w-[170px] flex-[0_0_170px] overflow-visible">
        <polygon points="100,150 170,182 100,214 30,182" className="fill-vl-cube-top" />
        <polygon points="30,150 100,182 100,214 30,182" className="fill-vl-cube-left" />
        <polygon points="100,182 170,150 170,182 100,214" className="fill-vl-cube-right" />
        <polygon points="100,118 170,150 100,182 30,150" className="fill-vl-cube-top" />
        <g className="animate-vl-float fill-none stroke-vl-accent" strokeWidth="1.5" strokeDasharray="5 5">
          <polygon points="100,54 170,86 100,118 30,86" />
          <polygon points="30,86 100,118 100,150 30,118" />
          <polygon points="100,118 170,86 170,118 100,150" />
        </g>
      </svg>
      <div className="min-w-0 flex-[1_1_260px]">
        <p className="font-vl-mono text-xs text-vl-accent">404</p>
        <h1 id="not-found-title" className="mt-0.5 text-[28px] font-bold tracking-[-0.02em]">
          This page is not in the tower
        </h1>
        <p className="mt-2 mb-4 text-vl-muted">
          The address may be mistyped, or the link is from an older version of the app.
        </p>
        <Link
          to="/"
          className="inline-flex h-[42px] items-center rounded-[10px] bg-vl-accent px-3.5 font-semibold text-vl-on-accent"
        >
          Back to the tower
        </Link>
      </div>
    </section>
  );
}
