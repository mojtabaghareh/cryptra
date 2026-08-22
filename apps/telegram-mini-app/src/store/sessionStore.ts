import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from '../types';

interface SessionState {
  token: string | null;
  user: SessionUser | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

interface SessionActions {
  setSession: (token: string, user: SessionUser) => void;
  setReady: (ready: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isReady: false,
      isLoading: false,
      error: null,

      setSession: (token, user) =>
        set({ token, user, isReady: true, isLoading: false, error: null }),

      setReady: (isReady) => set({ isReady }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),

      clear: () =>
        set({
          token: null,
          user: null,
          isReady: true,
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'cryptra-session',
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
);
