import { addressCube } from '../lib/identicon';

// Decoration only (DESIGN.md › Identity cube): the address is always written next to it.
export function IdentityCube({ address, className }: { address: string; className?: string }) {
  const cube = addressCube(address);
  return (
    <svg viewBox="0 0 40 36" aria-hidden="true" className={className}>
      <polygon points="20,3 37,11 20,19 3,11" fill={cube.top} />
      <polygon points="3,11 20,19 20,33 3,25" fill={cube.left} />
      <polygon points="20,19 37,11 37,25 20,33" fill={cube.right} />
    </svg>
  );
}
