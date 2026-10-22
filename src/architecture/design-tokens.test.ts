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

// The dark values are written twice (ADR-0008): for a dark choice in the navbar, and for the system's preference
// when nothing is chosen. Nothing else keeps the two lists alike.
function darkLists(block: string) {
  const declarations = (body: string | undefined) =>
    (body ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
  return [
    declarations(block.match(/:root\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/)?.[1]),
    declarations(block.match(/:root:not\(\[data-theme="light"\]\) \{\n([\s\S]*?)\n {2}\}/)?.[1]),
  ];
}

describe('AR-10 design tokens', () => {
  it('finds the CSS block in DESIGN.md', () => {
    expect(tokensBlock()).toContain('@theme {');
  });

  it('declares exactly that block in src/index.css', () => {
    expect(normalize(css)).toBe(tokensBlock());
  });

  it('gives the dark theme the same values for a choice and for the system', () => {
    const [chosen, system] = darkLists(normalize(css));
    expect(chosen.length).toBeGreaterThan(20);
    expect(system).toEqual(chosen);
  });
});
