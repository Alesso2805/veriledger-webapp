import type { Language } from '../../types/preferences';

// The API answers its errors in English (`detail`). The known ones are shown in the page's language; an unknown one
// is shown as it came, so nothing is hidden (ADR-0007). Each entry is the API's exact text or its pattern, with the
// numbers and names it carries; when the API adds a message, it shows in English until it is added here.
type Translation = [pattern: RegExp, spanish: (...parts: string[]) => string];

const SPANISH: Translation[] = [
  [/^Block not found$/, () => 'Bloque no encontrado'],
  [/^Transaction not found$/, () => 'Transacción no encontrada'],
  [/^Not Found$/, () => 'No encontrado'],
  [/^Node already registered$/, () => 'El nodo ya está registrado'],
  [/^Invalid credentials$/, () => 'Credenciales incorrectas'],
  [/^Email already registered$/, () => 'El correo ya está registrado'],
  [/^Could not validate credentials$/, () => 'No se pudieron validar las credenciales'],
  [/^Not authenticated$/, () => 'No has iniciado sesión'],
  [/^Not enough permissions$/, () => 'Permisos insuficientes'],
  [/^Invalid transaction signature$/, () => 'La firma de la transacción no es válida'],
  [/^Insufficient funds\. Balance: (.+), Required: (.+)$/, (balance, required) => `Fondos insuficientes. Saldo: ${balance}, necesario: ${required}`],
  [/^Nonce (\d+) is not the next one for this sender; the next is (\d+)$/, (used, next) => `El nonce ${used} no es el siguiente de este remitente; el siguiente es ${next}`],
  [/^Nonce (\d+) was just used by this sender$/, (used) => `Este remitente acaba de usar el nonce ${used}`],
  [/^Block (\d+) was just mined by another request; mine again$/, (number) => `Otra petición acaba de minar el bloque ${number}; vuelve a minar`],
  [/^(amount|fee) must be a decimal string with exactly 8 decimals, like '10\.00000000'$/, (field) => `${field} debe ser un número decimal con exactamente 8 decimales, como '10.00000000'`],
  [/^nonce must be an integer from 1 to (\d+)$/, (max) => `nonce debe ser un entero de 1 a ${max}`],
  [/^A peer URL starts with http:\/\/ or https:\/\/$/, () => 'La URL de un nodo empieza por http:// o https://'],
  [/^A peer URL needs a host$/, () => 'La URL de un nodo necesita un host'],
  [/^The peer's host does not resolve: (.+)$/, (host) => `El host del nodo no se resuelve: ${host}`],
  [
    /^The peer's host is not a public address: (.+)\. Loopback, private, link-local and reserved addresses need ALLOW_PRIVATE_PEERS$/,
    (host) => `El host del nodo no es una dirección pública: ${host}. Las direcciones loopback, privadas, link-local y reservadas necesitan ALLOW_PRIVATE_PEERS`,
  ],
  [/^The demo is full right now; try again later$/, () => 'La demo está llena ahora mismo; inténtalo más tarde'],
  [/^Too many demo accounts from your network in the last hour; try again later$/, () => 'Demasiadas cuentas demo desde tu red en la última hora; inténtalo más tarde'],
  [/^A demo account can mine (\d+) blocks? per hour; try again later$/, (limit) => `Una cuenta demo puede minar ${limit} ${limit === '1' ? 'bloque' : 'bloques'} por hora; inténtalo más tarde`],
  [/^Too many sign-in attempts from your network; try again in a minute$/, () => 'Demasiados intentos de inicio de sesión desde tu red; inténtalo en un minuto'],
  [/^Too many transactions from this sender; try again in a minute$/, () => 'Demasiadas transacciones de este remitente; inténtalo en un minuto'],
  [/^A block is being mined on this node; try again in a moment$/, () => 'Se está minando un bloque en este nodo; inténtalo en un momento'],
];

export function translateApiMessage(detail: string, language: Language): string {
  if (language === 'en') return detail;
  for (const [pattern, spanish] of SPANISH) {
    const match = pattern.exec(detail);
    if (match) return spanish(...match.slice(1));
  }
  return detail;
}
