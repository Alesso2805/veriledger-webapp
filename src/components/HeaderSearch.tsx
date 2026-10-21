import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

// Finds transactions by hash. Block numbers and hashes, with the dropdown of the artboard, come with VLW-19.
export function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const hash = query.trim();
    if (hash) navigate(`/transaction/${encodeURIComponent(hash)}`);
  };

  return (
    <form role="search" onSubmit={submit} className="relative order-2 max-w-[520px] flex-[1_1_280px] sm:order-none">
      <label htmlFor="header-search" className="sr-only">
        Search a transaction by hash
      </label>
      <input
        id="header-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Transaction hash"
        autoComplete="off"
        className="h-10 w-full rounded-[10px] border border-vl-line bg-vl-surface px-3 text-sm text-vl-text placeholder:text-vl-faint"
      />
    </form>
  );
}
