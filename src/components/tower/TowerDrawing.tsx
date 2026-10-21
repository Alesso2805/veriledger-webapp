import { cubeFaces } from '../../lib/isometric';
import type { Block } from '../../types/ledger';

const CX = 170;
// Level 0 sits on the shadow; each block above it is 40 px higher.
const levelTop = (level: number) => 480 - level * 40;

interface Props {
  // The newest blocks, newest first; the oldest of them is drawn at the bottom.
  blocks: Block[];
  loading: boolean;
  focus: number | null;
  fresh: ReadonlySet<number>;
  ghost: { number: number; floating: boolean } | null;
  olderText: string;
}

export function TowerDrawing({ blocks, loading, focus, fresh, ghost, olderText }: Props) {
  if (loading) {
    return (
      <svg viewBox="0 0 440 560" role="img" aria-label="Loading blocks" className="w-full max-w-[440px] self-center">
        {[0, 1, 2, 3, 4].map((level) => {
          const faces = cubeFaces(CX, levelTop(level));
          return (
            <g key={level} className="animate-vl-pulse">
              <polygon points={faces.left} className="fill-vl-raised" />
              <polygon points={faces.right} className="fill-vl-line-soft" />
              <polygon points={faces.top} className="fill-vl-line" />
            </g>
          );
        })}
      </svg>
    );
  }

  const stack = [...blocks].reverse();
  const label = stack.length
    ? `Tower of the ${stack.length} newest blocks, #${stack[0].block_number} at the bottom and #${blocks[0].block_number} on top`
    : 'No blocks yet';
  const ghostFaces = cubeFaces(CX, levelTop(stack.length));

  return (
    <svg viewBox="0 0 440 560" role="img" aria-label={label} className="w-full max-w-[440px] self-center overflow-visible">
      <ellipse cx={CX} cy="532" rx="150" ry="22" className="fill-vl-shadow" />
      <text x="20" y="552" className="fill-vl-muted font-vl-mono text-[11px]">
        {olderText}
      </text>
      {stack.map((block, level) => {
        const faces = cubeFaces(CX, levelTop(level));
        const on = block.block_number === focus;
        const fill = 'transition-[fill] duration-300';
        return (
          <g
            key={block.block_number}
            className={`transition-transform duration-[380ms] ease-vl-out ${on ? 'translate-x-[18px]' : ''} ${
              fresh.has(block.block_number) ? 'animate-vl-drop' : ''
            }`}
          >
            <polygon points={faces.left} className={`${fill} ${on ? 'fill-vl-cube-left-on' : 'fill-vl-cube-left'}`} />
            <polygon points={faces.right} className={`${fill} ${on ? 'fill-vl-cube-right-on' : 'fill-vl-cube-right'}`} />
            <polygon points={faces.top} className={`${fill} ${on ? 'fill-vl-accent' : 'fill-vl-cube-top'}`} />
            <text x="262" y={levelTop(level) + 28} className={`${fill} font-vl-mono text-xs ${on ? 'fill-vl-text' : 'fill-vl-muted'}`}>
              #{block.block_number}
            </text>
          </g>
        );
      })}
      {ghost && (
        <g
          className={`fill-none stroke-vl-accent ${ghost.floating ? 'animate-vl-float' : ''}`}
          strokeWidth="1.5"
          strokeDasharray="5 5"
        >
          <polygon points={ghostFaces.left} />
          <polygon points={ghostFaces.right} />
          <polygon points={ghostFaces.top} />
          <text x="262" y={levelTop(stack.length) + 28} className="fill-vl-accent stroke-none font-vl-mono text-xs">
            #{ghost.number}
          </text>
        </g>
      )}
    </svg>
  );
}
