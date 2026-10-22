import { describe, expect, it } from 'vitest';
import { refusalKind, type RefusalKind } from './refusal';

describe('refusalKind', () => {
  it.each<[number | undefined, string, RefusalKind]>([
    [400, 'Invalid transaction signature', 'signature'],
    [400, 'La firma de la transacción no es válida', 'signature'],
    [400, 'Insufficient funds. Balance: 50.0, Required: 60.1', 'funds'],
    [400, 'Fondos insuficientes. Saldo: 50.0, necesario: 60.1', 'funds'],
    [409, 'Nonce 1 is not the next one for this sender; the next is 2', 'nonce'],
    [422, 'Request failed with status code 422', 'other'],
    [undefined, 'Network Error', 'noAnswer'],
  ])('a %s saying %j is %j', (status, detail, kind) => {
    expect(refusalKind(status, detail)).toBe(kind);
  });
});
