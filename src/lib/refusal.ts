export type RefusalKind = 'noAnswer' | 'nonce' | 'signature' | 'funds' | 'other';

// What kind of refusal a transaction met, taken from what the API says; the dictionary titles it, and the API's own
// words are shown under the title. The detail may already be in Spanish (ADR-0007), so both languages are read.
// status is undefined when no answer arrived at all.
export function refusalKind(status: number | undefined, detail: string): RefusalKind {
  if (status === undefined) return 'noAnswer';
  if (status === 409) return 'nonce';
  if (/signature|firma/i.test(detail)) return 'signature';
  if (/funds|fondos/i.test(detail)) return 'funds';
  return 'other';
}
