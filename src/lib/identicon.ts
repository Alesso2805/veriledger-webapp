// The identity cube of DESIGN.md › Identity cube: an address drawn as a cube whose faces come from its first
// three bytes. Decoration next to the address text, never instead of it.
const PALETTE = ['#FFB547', '#7CC4FF', '#5AD19A', '#FF8A65', '#B79CFF', '#F2E56B', '#6FD3D8', '#E8EAEE'];

const shade = (hex: string, f: number) =>
  '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, '0')).join('');

export interface CubeColors {
  top: string;
  left: string;
  right: string;
}

export function addressCube(address: string): CubeColors {
  const pick = (i: number) => PALETTE[parseInt(address.slice(i * 2, i * 2 + 2), 16) % 8];
  return { top: pick(0), left: shade(pick(1), 0.55), right: shade(pick(2), 0.75) };
}

// The cube of an address still being typed: a face is null until its byte is complete, and the page draws it grey.
export function partialCube(typed: string): { top: string | null; left: string | null; right: string | null } {
  const byte = (i: number) => /^[0-9a-f]{2}$/.test(typed.slice(i * 2, i * 2 + 2));
  const cube = addressCube(typed.padEnd(6, '0'));
  return { top: byte(0) ? cube.top : null, left: byte(1) ? cube.left : null, right: byte(2) ? cube.right : null };
}
