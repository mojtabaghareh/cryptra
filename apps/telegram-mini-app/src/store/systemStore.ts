import { create } from 'zustand';

interface SystemState {
  online: boolean;
  lastError: string | null;
  setOnline: (v: boolean) => void;
  setLastError: (e: string | null) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  online: true,
  lastError: null,
  setOnline: (online) => set({ online }),
  setLastError: (lastError) => set({ lastError }),
}));
