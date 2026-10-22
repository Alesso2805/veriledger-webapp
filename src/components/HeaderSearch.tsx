import { useEffect, useState, type FocusEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { transactionKind } from '../lib/format';
import type { Messages } from '../lib/i18n';
import { parseSearch } from '../lib/search';
import { detailOf } from '../services/api';
import { findBlockNumber, findHash, type Found } from '../services/ledger';
import { useT } from './useT';

type Results =
  | { phase: 'idle' }
  | { phase: 'searching' }
  | { phase: 'found'; items: Found[] }
  | { phase: 'message'; text: string };

const WAIT_MS = 250;

function present(item: Found, t: Messages): { label: string; meta: string; to: string } {
  if (item.kind === 'block') {
    return { label: t.shell.search.block(item.number), meta: `${item.hash.slice(0, 12)}…`, to: `/?block=${item.number}` };
  }
  const { transaction } = item;
  const hash = transaction.tx_hash ?? '';
  return {
    label: `${t.kinds[transactionKind(transaction)]} ${hash.slice(0, 8)}…`,
    meta: typeof transaction.block_number === 'number' ? t.shell.search.inBlock(transaction.block_number) : t.shell.search.waiting,
    to: `/transaction/${hash}`,
  };
}

// Finds a block by its number, or a block or a transaction by its full hash. The API cannot search by prefix,
// so part of a hash is not looked up (VLW-19).
export function HeaderSearch() {
  const t = useT();
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
      setResults({ phase: 'message', text: t.shell.search.typeMore });
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
                search.kind === 'number' ? t.shell.search.noBlock(search.number) : t.shell.search.noHash,
            });
        },
        (error: unknown) => active && setResults({ phase: 'message', text: detailOf(error, t.shell.search.noAnswer) }),
      );
    }, WAIT_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [lookup, t]);

  const go = (item: Found) => {
    navigate(present(item, t).to);
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
      className="relative max-w-[480px] flex-[1_1_280px] max-sm:order-2"
    >
      <label htmlFor="header-search" className="sr-only">
        {t.shell.search.label}
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
        placeholder={t.shell.search.placeholder}
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full rounded-[14px] border-[1.5px] border-vl-line bg-vl-surface px-4 text-[15px] text-vl-text placeholder:text-vl-muted"
      />
      {open && results.phase !== 'idle' && (
        <div
          role="listbox"
          aria-label={t.shell.search.results}
          className="absolute top-[52px] right-0 left-0 z-40 animate-vl-fade-up rounded-[18px] bg-vl-surface p-1.5 shadow-[0_12px_32px_var(--color-vl-shadow)]"
        >
          {results.phase === 'searching' && (
            <p aria-live="polite" className="animate-vl-pulse p-3 text-[15px] text-vl-muted">
              {t.shell.search.lookingUp}
            </p>
          )}
          {results.phase === 'message' && (
            <p aria-live="polite" className="p-3 text-[15px] text-vl-muted">
              {results.text}
            </p>
          )}
          {results.phase === 'found' &&
            results.items.map((item) => {
              const { label, meta, to } = present(item, t);
              return (
                <div key={to} role="option" aria-selected="false">
                  <button
                    type="button"
                    onClick={() => go(item)}
                    className="flex w-full justify-between gap-3 rounded-xl p-3 text-left text-[15px] font-bold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
                  >
                    <span>{label}</span> <span className="font-vl-mono text-xs font-normal text-vl-muted">{meta}</span>
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </form>
  );
}
