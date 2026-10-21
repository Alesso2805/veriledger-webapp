import { describe, expect, it } from 'vitest';
import design from '../../docs/DESIGN.md?raw';
import css from '../index.css?raw';

// AR-10: src/index.css is the CSS block of DESIGN.md › Tokens and motion, character for character,
// so the canvas and the code share the same tokens and keyframes.
const normalize = (text: string) => text.replace(/\r\n/g, '\n');

function tokensBlock() {
  const section = normalize(design).split('## Tokens and motion')[1] ?? '';
  return section.match(/```css\n([\s\S]*?)```/)?.[1];
}

describe('AR-10 design tokens', () => {
  it('finds the CSS block in DESIGN.md', () => {
    expect(tokensBlock()).toContain('@theme {');
  });

  it('declares exactly that block in src/index.css', () => {
    expect(normalize(css)).toBe(tokensBlock());
  });
});
