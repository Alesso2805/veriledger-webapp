export type SearchQuery =
  | { kind: 'empty' }
  | { kind: 'number'; number: number }
  | { kind: 'hash'; hash: string }
  // Anything else, such as part of a hash: the API cannot search by prefix.
  | { kind: 'incomplete' };

// What the API can look up: a block number ("12" or "#12") or a full 64-character hash.
export function parseSearch(input: string): SearchQuery {
  const text = input.trim().toLowerCase();
  if (!text) return { kind: 'empty' };
  const number = /^#?(\d{1,15})$/.exec(text);
  if (number) return { kind: 'number', number: Number(number[1]) };
  if (/^[0-9a-f]{64}$/.test(text)) return { kind: 'hash', hash: text };
  return { kind: 'incomplete' };
}
