import { create } from 'zustand';

interface HealthState {
  // null until the first /health answer or failure
  online: boolean | null;
  // Whether the node starts demo accounts; false until /health says so (VLA-35).
  demoMode: boolean;
  setOnline: (online: boolean) => void;
  setDemoMode: (demoMode: boolean) => void;
}

export const useHealthStore = create<HealthState>()((set) => ({
  online: null,
  demoMode: false,
  setOnline: (online) => set({ online }),
  setDemoMode: (demoMode) => set({ demoMode }),
}));
