import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  token: string | null;
  // Why the last session ended without a sign-out, for the login's notice (VLW-17).
  endedReason: 'expired' | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  expire: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      endedReason: null,
      setToken: (token) => set({ token, endedReason: null }),
      logout: () => set({ token: null, endedReason: null }),
      expire: () => set({ token: null, endedReason: 'expired' }),
    }),
    {
      name: 'veriledger-storage',
      // Only the token survives a reload; the reason is for the redirect that follows, not for later visits.
      partialize: (state) => ({ token: state.token }),
    }
  )
);
