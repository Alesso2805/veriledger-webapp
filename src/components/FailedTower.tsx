// The 404's tower with its top cube outlined in the danger colour. It holds still: nothing is missing this time,
// something broke.
export function FailedTower({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true" className={className}>
      <polygon points="100,150 170,182 100,214 30,182" className="fill-vl-cube-top" />
      <polygon points="30,150 100,182 100,214 30,182" className="fill-vl-cube-left" />
      <polygon points="100,182 170,150 170,182 100,214" className="fill-vl-cube-right" />
      <polygon points="100,118 170,150 100,182 30,150" className="fill-vl-cube-top" />
      <g className="fill-none stroke-vl-danger" strokeWidth="1.5" strokeDasharray="5 5">
        <polygon points="100,54 170,86 100,118 30,86" />
        <polygon points="30,86 100,118 100,150 30,118" />
        <polygon points="100,118 170,86 170,118 100,150" />
      </g>
    </svg>
  );
}
