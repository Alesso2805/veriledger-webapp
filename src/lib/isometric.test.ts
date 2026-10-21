import { describe, expect, it } from 'vitest';
import { cubeFaces } from './isometric';

describe('cubeFaces', () => {
  it('draws the bottom cube of the login tower as the artboard does', () => {
    expect(cubeFaces(170, 270)).toEqual({
      top: '170,247 250,270 170,293 90,270',
      left: '90,270 170,293 170,327 90,304',
      right: '170,293 250,270 250,304 170,327',
    });
  });

  it('moves the whole cube with its top', () => {
    const lower = cubeFaces(170, 270);
    const upper = cubeFaces(170, 230);

    expect(upper.top).toBe(lower.top.replace(/,(\d+)/g, (_, y: string) => `,${Number(y) - 40}`));
  });
});
