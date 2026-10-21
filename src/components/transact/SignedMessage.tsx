import { shortHash } from '../../lib/format';

// Long addresses and the payload are shortened to fit; the byte count is of the full message.
const shown = (key: string, json: string) =>
  (key.endsWith('address') || key === 'payload') && json.length > 24 ? `"${shortHash(json.slice(1, -1), 8)}"` : json;

export function SignedMessage({ lines, bytes }: { lines: [string, string][]; bytes: number | null }) {
  return (
    <div className="rounded-2xl border border-vl-line bg-vl-inset">
      <div className="flex flex-wrap justify-between gap-2 border-b border-vl-line px-4 py-3">
        <h2 id="msg-h" className="text-[15px] font-semibold">
          What you are signing
        </h2>
        <span className="font-vl-mono text-[11px] text-vl-muted">{bytes ?? '—'} bytes · keys sorted · no spaces</span>
      </div>
      <div className="px-4 py-3.5 font-vl-mono text-[13px] leading-[1.8] [overflow-wrap:anywhere]">
        <div className="text-vl-muted">{'{'}</div>
        {lines.map(([key, json], index) => (
          <div key={key} className="pl-4">
            <span className="text-vl-muted">"{key}":</span>
            <span className={key === 'nonce' ? 'text-vl-accent' : undefined}>{shown(key, json)}</span>
            {index < lines.length - 1 ? ',' : ''}
          </div>
        ))}
        <div className="text-vl-muted">{'}'}</div>
      </div>
    </div>
  );
}
