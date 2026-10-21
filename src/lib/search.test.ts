import { describe, expect, it } from 'vitest';
import { parseSearch } from './search';

describe('parseSearch', () => {
  it('reads a block number, with or without "#"', () => {
    expect(parseSearch(' 12 ')).toEqual({ kind: 'number', number: 12 });
    expect(parseSearch('#0')).toEqual({ kind: 'number', number: 0 });
  });

  it('reads a full hash in either case', () => {
    expect(parseSearch('AB'.repeat(32))).toEqual({ kind: 'hash', hash: 'ab'.repeat(32) });
  });

  it('treats anything else as incomplete, since the API cannot search by prefix', () => {
    expect(parseSearch('ab12')).toEqual({ kind: 'incomplete' });
    expect(parseSearch('ab'.repeat(33))).toEqual({ kind: 'incomplete' });
    expect(parseSearch('-3')).toEqual({ kind: 'incomplete' });
  });

  it('is empty for blank text', () => {
    expect(parseSearch('   ')).toEqual({ kind: 'empty' });
  });
});
