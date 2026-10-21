import { describe, expect, it } from 'vitest';
import { refusalTitle } from './refusal';

describe('refusalTitle', () => {
  it.each<[number | undefined, string, string]>([
    [400, 'Invalid transaction signature', 'The node refused the signature'],
    [400, 'Insufficient funds. Balance: 50.0, Required: 60.1', 'Not enough funds'],
    [409, 'Nonce 1 is not the next one for this sender; the next is 2', 'This nonce was already used'],
    [422, 'Request failed with status code 422', 'The node refused the transaction'],
    [undefined, 'Network Error', 'The node did not answer'],
  ])('a %s saying %j is titled %j', (status, detail, title) => {
    expect(refusalTitle(status, detail)).toBe(title);
  });
});
