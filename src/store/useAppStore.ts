import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '../types/session';

interface AppState {
  token: string | null;
  // Why the last session ended without a sign-out, for the login's notice (VLW-17).
  endedReason: 'expired' | null;
  // GET /auth/me, read once per session by the header's user chip and used by pages for role rules.
  user: CurrentUser | null;
  setToken: (token: string | null) => void;
  setUser: (user: CurrentUser | null) => void;
  logout: () => void;
  expire: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      endedReason: null,
      user: null,
      setToken: (token) => set({ token, endedReason: null, user: null }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, endedReason: null, user: null }),
      expire: () => set({ token: null, endedReason: 'expired', user: null }),
    }),
    {
      name: 'veriledger-storage',
      // Only the token survives a reload; the reason is for the redirect that follows, not for later visits.
      partialize: (state) => ({ token: state.token }),
    }
  )
);
