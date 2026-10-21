import { useEffect } from 'react';
import { isExpired } from '../lib/jwt';
import { useAppStore } from '../store/useAppStore';

// The stored token, unless its exp has passed; an expired token is cleared and remembered as expired.
export function useSessionToken() {
  const token = useAppStore((state) => state.token);
  const expire = useAppStore((state) => state.expire);
  const expired = token !== null && isExpired(token);

  useEffect(() => {
    if (expired) expire();
  }, [expired, expire]);

  return { token: expired ? null : token, expired };
}
