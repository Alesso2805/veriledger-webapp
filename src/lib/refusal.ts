// The heading of a refused transaction, taken from what the API says; its own words are shown under it as they are.
// status is undefined when no answer arrived at all.
export function refusalTitle(status: number | undefined, detail: string): string {
  if (status === undefined) return 'The node did not answer';
  if (status === 409) return 'This nonce was already used';
  if (/signature/i.test(detail)) return 'The node refused the signature';
  if (/funds/i.test(detail)) return 'Not enough funds';
  return 'The node refused the transaction';
}
