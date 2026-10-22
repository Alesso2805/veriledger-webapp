import { create } from 'zustand';

interface HealthState {
  // null until the first /health answer or failure
  online: boolean | null;
  // Offline because the API answered that its database does not, rather than not answering at all.
  databaseDown: boolean;
  // Whether the node starts demo accounts; false until /health says so.
  demoMode: boolean;
  setOnline: (online: boolean) => void;
  setDatabaseDown: (databaseDown: boolean) => void;
  setDemoMode: (demoMode: boolean) => void;
}

export const useHealthStore = create<HealthState>()((set) => ({
  online: null,
  databaseDown: false,
  demoMode: false,
  setOnline: (online) => set({ online }),
  setDatabaseDown: (databaseDown) => set({ databaseDown }),
  setDemoMode: (demoMode) => set({ demoMode }),
}));
