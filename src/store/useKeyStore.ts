import { create } from 'zustand';
import type { Wallet } from '../types/ledger';

interface KeyState {
  // The pair this tab signs with. Only in memory: a reload forgets it, and nothing persists it (ADR-0002).
  pair: Wallet | null;
  // Whether a key file of it exists: true for a key opened from its file, false for one just created until the
  // person downloads it and says it is stored. The wallet page asks to save the key while this is false.
  saved: boolean;
  hold: (pair: Wallet, saved: boolean) => void;
  markSaved: () => void;
  forget: () => void;
}

export const useKeyStore = create<KeyState>()((set) => ({
  pair: null,
  saved: false,
  hold: (pair, saved) => set({ pair, saved }),
  markSaved: () => set({ saved: true }),
  forget: () => set({ pair: null, saved: false }),
}));
