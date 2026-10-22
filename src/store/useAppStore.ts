import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser, SessionEndReason } from '../types/session';

interface AppState {
  token: string | null;
  // Why the last session ended without a sign-out, for the login's notice.
  endedReason: SessionEndReason | null;
  // GET /auth/me, read once per session by the header's user chip and used by pages for role rules.
  user: CurrentUser | null;
  // A demo account is being started; the header, the login and the chain's mine button all say so.
  startingDemo: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: CurrentUser | null) => void;
  logout: () => void;
  // The caller says why, from the token's claims: the store reads no tokens (AR-03).
  expire: (reason?: SessionEndReason) => void;
  clearEndedReason: () => void;
  setStartingDemo: (startingDemo: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      endedReason: null,
      user: null,
      startingDemo: false,
      setToken: (token) => set({ token, endedReason: null, user: null }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, endedReason: null, user: null }),
      expire: (reason = 'expired') => set({ token: null, endedReason: reason, user: null }),
      clearEndedReason: () => set({ endedReason: null }),
      setStartingDemo: (startingDemo) => set({ startingDemo }),
    }),
    {
      name: 'veriledger-storage',
      // Only the token survives a reload; the reason is for the redirect that follows, not for later visits.
      partialize: (state) => ({ token: state.token }),
      // Storage edited by hand or by something else can hold anything. Every page reads the token's claims, and only
      // text has them, so any other value starts the app signed out instead of failing on every page.
      merge: (persisted, current) => {
        const token = (persisted as { token?: unknown } | null)?.token;
        return { ...current, token: typeof token === 'string' ? token : null };
      },
    }
  )
);
