// Reads a JWT's `exp` without checking its signature: the API does that. The browser only uses it to
// drop a session it already knows has ended.
export function expiresAt(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp: unknown = JSON.parse(json).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

// A token with no readable `exp` is not treated as expired; if it is invalid, the API's 401 ends the session.
export function isExpired(token: string, now: number = Date.now()): boolean {
  const expiry = expiresAt(token);
  return expiry !== null && expiry <= now;
}
