import { useEffect } from 'react';
import { endReason, isExpired } from '../lib/jwt';
import { useAppStore } from '../store/useAppStore';

// The stored token, unless its exp has passed; an expired token is cleared, remembering whether it was a demo.
export function useSessionToken() {
  const token = useAppStore((state) => state.token);
  const expire = useAppStore((state) => state.expire);
  const ended = token !== null && isExpired(token) ? endReason(token) : null;

  useEffect(() => {
    if (ended) expire(ended);
  }, [ended, expire]);

  return { token: ended ? null : token, ended };
}
