import { describe, expect, it } from 'vitest';
import { translateApiMessage } from './apiMessages';

describe('the API messages', () => {
  it.each([
    ['Node already registered', 'El nodo ya está registrado'],
    ['Insufficient funds. Balance: 50.0, Required: 60.1', 'Fondos insuficientes. Saldo: 50.0, necesario: 60.1'],
    ['Nonce 7 is not the next one for this sender; the next is 8', 'El nonce 7 no es el siguiente de este remitente; el siguiente es 8'],
    ['A demo account can mine 1 block per hour; try again later', 'Una cuenta demo puede minar 1 bloque por hora; inténtalo más tarde'],
    ['A demo account can mine 5 blocks per hour; try again later', 'Una cuenta demo puede minar 5 bloques por hora; inténtalo más tarde'],
    [
      "The peer's host is not a public address: 10.0.0.5. Loopback, private, link-local and reserved addresses need ALLOW_PRIVATE_PEERS",
      'El host del nodo no es una dirección pública: 10.0.0.5. Las direcciones loopback, privadas, link-local y reservadas necesitan ALLOW_PRIVATE_PEERS',
    ],
  ])('shows "%s" in Spanish', (detail, spanish) => {
    expect(translateApiMessage(detail, 'es')).toBe(spanish);
  });

  it('shows an unknown message as it came, so nothing is hidden', () => {
    expect(translateApiMessage('Internal Server Error', 'es')).toBe('Internal Server Error');
  });

  it('leaves English as the API wrote it', () => {
    expect(translateApiMessage('Node already registered', 'en')).toBe('Node already registered');
  });
});
