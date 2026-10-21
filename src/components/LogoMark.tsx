export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true" className={className}>
      <path d="M13 2l10 5.5-10 5.5L3 7.5z" className="fill-vl-accent" />
      <path d="M3 7.5l10 5.5v11L3 18.5z" className="fill-vl-cube-top" />
      <path d="M23 7.5l-10 5.5v11l10-5.5z" className="fill-vl-cube-left" />
    </svg>
  );
}
