import { useEffect, useState, type FocusEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { transactionKind } from '../lib/format';
import { parseSearch } from '../lib/search';
import { detailOf } from '../services/api';
import { findBlockNumber, findHash, type Found } from '../services/ledger';

type Results =
  | { phase: 'idle' }
  | { phase: 'searching' }
  | { phase: 'found'; items: Found[] }
  | { phase: 'message'; text: string };

const WAIT_MS = 250;

function present(item: Found): { label: string; meta: string; to: string } {
  if (item.kind === 'block') {
    return { label: `Block #${item.number}`, meta: `${item.hash.slice(0, 12)}…`, to: `/?block=${item.number}` };
  }
  const { transaction } = item;
  const hash = transaction.tx_hash ?? '';
  return {
    label: `${transactionKind(transaction)} ${hash.slice(0, 8)}…`,
    meta: typeof transaction.block_number === 'number' ? `in block #${transaction.block_number}` : 'waiting',
    to: `/transaction/${hash}`,
  };
}

// Finds a block by its number, or a block or a transaction by its full hash. The API cannot search by prefix,
// so part of a hash is not looked up (VLW-19).
export function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Results>({ phase: 'idle' });
  const parsed = parseSearch(query);
  const lookup = parsed.kind === 'number' ? `#${parsed.number}` : parsed.kind === 'hash' ? parsed.hash : parsed.kind;

  // Looks up once the text is something the API can find, a moment after the typing stops.
  useEffect(() => {
    if (lookup === 'empty') {
      setResults({ phase: 'idle' });
      return;
    }
    if (lookup === 'incomplete') {
      setResults({ phase: 'message', text: 'Type a block number or a full 64-character hash.' });
      return;
    }
    const search = parseSearch(lookup);
    let active = true;
    setResults({ phase: 'searching' });
    const timer = setTimeout(() => {
      if (search.kind !== 'number' && search.kind !== 'hash') return;
      const found = search.kind === 'number' ? findBlockNumber(search.number) : findHash(search.hash);
      found.then(
        (items) => {
          if (!active) return;
          if (items.length) setResults({ phase: 'found', items });
          else
            setResults({
              phase: 'message',
              text:
                search.kind === 'number'
                  ? `No block #${search.number} yet.`
                  : 'No block or transaction with this hash on this node.',
            });
        },
        (error: unknown) => active && setResults({ phase: 'message', text: detailOf(error, 'The node did not answer') }),
      );
    }, WAIT_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [lookup]);

  const go = (item: Found) => {
    navigate(present(item).to);
    setQuery('');
    setOpen(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (results.phase === 'found') go(results.items[0]);
  };

  // Closes when the focus leaves the search and its results, not when it moves between them.
  const leave = (event: FocusEvent<HTMLFormElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      onBlur={leave}
      onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
      className="relative order-2 max-w-[520px] flex-[1_1_280px] sm:order-none"
    >
      <label htmlFor="header-search" className="sr-only">
        Search a block number or a hash
      </label>
      <input
        id="header-search"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Block number or hash"
        autoComplete="off"
        spellCheck={false}
        className="h-10 w-full rounded-[10px] border border-vl-line bg-vl-surface px-3 text-sm text-vl-text placeholder:text-vl-faint"
      />
      {open && results.phase !== 'idle' && (
        <div
          role="listbox"
          aria-label="Results"
          className="absolute top-[46px] right-0 left-0 z-40 animate-vl-fade-up rounded-xl border border-vl-line bg-vl-raised p-1.5"
        >
          {results.phase === 'searching' && (
            <p aria-live="polite" className="animate-vl-pulse p-2.5 text-sm text-vl-muted">
              Looking it up…
            </p>
          )}
          {results.phase === 'message' && (
            <p aria-live="polite" className="p-2.5 text-sm text-vl-muted">
              {results.text}
            </p>
          )}
          {results.phase === 'found' &&
            results.items.map((item) => {
              const { label, meta, to } = present(item);
              return (
                <div key={to} role="option" aria-selected="false">
                  <button
                    type="button"
                    onClick={() => go(item)}
                    className="flex w-full justify-between gap-3 rounded-lg p-2.5 text-left text-sm font-medium transition-colors duration-(--vl-dur-fast) hover:bg-vl-surface"
                  >
                    <span>{label}</span> <span className="font-vl-mono text-[11px] text-vl-muted">{meta}</span>
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </form>
  );
}
