import { addressCube } from '../lib/identicon';

// The artboards draw the cube at two sizes: small next to an address, large as the wallet's identity.
const SHAPES = {
  small: {
    viewBox: '0 0 40 36',
    top: '20,3 37,11 20,19 3,11',
    left: '3,11 20,19 20,33 3,25',
    right: '20,19 37,11 37,25 20,33',
  },
  large: {
    viewBox: '0 0 132 120',
    top: '66,8 124,35 66,62 8,35',
    left: '8,35 66,62 66,112 8,85',
    right: '66,62 124,35 124,85 66,112',
  },
};

// Decoration only (DESIGN.md › Identity cube): the address is always written next to it.
export function IdentityCube({
  address,
  className,
  size = 'small',
}: {
  address: string;
  className?: string;
  size?: keyof typeof SHAPES;
}) {
  const cube = addressCube(address);
  const shape = SHAPES[size];
  return (
    <svg viewBox={shape.viewBox} aria-hidden="true" className={className}>
      <polygon points={shape.top} fill={cube.top} />
      <polygon points={shape.left} fill={cube.left} />
      <polygon points={shape.right} fill={cube.right} />
    </svg>
  );
}
