// The peer map of DESIGN.md › Network keeps the artboard's fixed geometry: this node in the centre of an
// 860 × 440 box, the peers evenly on a ring around it. On a narrow screen the box scrolls sideways.
export const MAP = { width: 860, height: 440, cx: 430, cy: 220, radius: 170 };

export interface RingPoint {
  x: number;
  y: number;
  // The direction from this node, for the edge drawn to the peer.
  degrees: number;
}

// The first peer at the top, the rest clockwise.
export function ringPoints(count: number): RingPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return {
      x: Math.round(MAP.cx + MAP.radius * Math.cos(angle)),
      y: Math.round(MAP.cy + MAP.radius * Math.sin(angle)),
      degrees: Math.round((angle * 180) / Math.PI),
    };
  });
}

// How a peer is named in its circle: the host's first label over the rest ("node-b" over "example.org").
// An address such as 127.0.0.1 stays whole, over its port.
export function peerLabel(url: string): { name: string; detail: string } {
  let host: URL;
  try {
    host = new URL(url);
  } catch {
    return { name: url, detail: '' };
  }
  const port = host.port ? `:${host.port}` : '';
  if (/^\d+(\.\d+){3}$/.test(host.hostname) || host.hostname.startsWith('[')) {
    return { name: host.hostname, detail: port || host.protocol.replace(':', '') };
  }
  const [first, ...rest] = host.hostname.split('.');
  return { name: first, detail: `${rest.join('.')}${port}`.slice(0, 14) };
}

// Only the form of the address is checked here; the API decides whether the host is public and resolves.
export function looksLikePeerUrl(text: string): boolean {
  return /^https?:\/\/[^\s/]+/.test(text.trim());
}
