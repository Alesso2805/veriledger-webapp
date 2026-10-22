import type { SessionEndReason } from '../types/session';

// Reads a JWT's claims without checking its signature: the API does that. The browser only uses them to
// drop a session it already knows has ended, and to say why.
function claimsOf(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof claims === 'object' && claims !== null ? (claims as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function expiresAt(token: string): number | null {
  const exp = claimsOf(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

// A token with no readable `exp` is not treated as expired; if it is invalid, the API's 401 ends the session.
export function isExpired(token: string, now: number = Date.now()): boolean {
  const expiry = expiresAt(token);
  return expiry !== null && expiry <= now;
}

// A demo account's token carries "demo": true. It is the only trace of the demo after a reload, because
// the user from /auth/me is not kept.
export function isDemo(token: string): boolean {
  return claimsOf(token)?.demo === true;
}

export function endReason(token: string): SessionEndReason {
  return isDemo(token) ? 'demo-ended' : 'expired';
}
