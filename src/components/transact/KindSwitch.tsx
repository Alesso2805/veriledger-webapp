import type { Kind } from '../../lib/compose';
import { useT } from '../useT';

// The pill slides with transform when the kind changes (DESIGN.md › Motion map).
export function KindSwitch({ kind, onChange }: { kind: Kind; onChange: (kind: Kind) => void }) {
  const t = useT();
  const options: [Kind, string][] = [
    ['transfer', t.transact.transfer],
    ['notarize', t.transact.notarize],
  ];
  return (
    <div role="group" aria-label={t.transact.kind} className="relative grid grid-cols-2 rounded-[10px] border border-vl-line bg-vl-bg p-1">
      <span
        aria-hidden="true"
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-[7px] bg-vl-raised transition-transform duration-300 ease-vl-out ${
          kind === 'notarize' ? 'translate-x-full' : ''
        }`}
      />
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={kind === value}
          onClick={() => onChange(value)}
          className={`relative h-[38px] text-sm font-semibold transition-colors duration-(--vl-dur-base) ${
            kind === value ? 'text-vl-text' : 'text-vl-muted'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
