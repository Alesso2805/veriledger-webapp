import { create } from 'zustand';
import type { Wallet } from '../types/ledger';

interface KeyState {
  // The pair this tab signs with. Only in memory: a reload forgets it, and nothing persists it (ADR-0002).
  pair: Wallet | null;
  hold: (pair: Wallet) => void;
  forget: () => void;
}

export const useKeyStore = create<KeyState>()((set) => ({
  pair: null,
  hold: (pair) => set({ pair }),
  forget: () => set({ pair: null }),
}));
