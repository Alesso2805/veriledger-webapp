export interface CubeFaces {
  top: string;
  left: string;
  right: string;
}

const point = (x: number, y: number) => `${x},${y}`;

// One isometric cube as SVG polygon points: 80 px half-width, 23 px rise and 34 px sides, as drawn in the artboards.
export function cubeFaces(cx: number, topY: number): CubeFaces {
  return {
    top: [point(cx, topY - 23), point(cx + 80, topY), point(cx, topY + 23), point(cx - 80, topY)].join(' '),
    left: [point(cx - 80, topY), point(cx, topY + 23), point(cx, topY + 57), point(cx - 80, topY + 34)].join(' '),
    right: [point(cx, topY + 23), point(cx + 80, topY), point(cx + 80, topY + 34), point(cx, topY + 57)].join(' '),
  };
}
