import { create } from 'zustand';

interface HealthState {
  // null until the first /health answer or failure
  online: boolean | null;
  setOnline: (online: boolean) => void;
}

export const useHealthStore = create<HealthState>()((set) => ({
  online: null,
  setOnline: (online) => set({ online }),
}));
