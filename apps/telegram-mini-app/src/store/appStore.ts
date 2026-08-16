import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isReady: boolean;
  isOnline: boolean;
  theme: 'dark' | 'light' | 'system';
  language: string;
  lastSyncAt: string | null;
  hapticEnabled: boolean;
}

interface AppActions {
  setReady: (ready: boolean) => void;
  setOnline: (online: boolean) => void;
  setTheme: (theme: AppState['theme']) => void;
  setLanguage: (lang: string) => void;
  setLastSync: (date: string) => void;
  toggleHaptic: () => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      isReady: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      theme: 'dark',
      language: 'en',
      lastSyncAt: null,
      hapticEnabled: true,

      setReady: (ready) => set({ isReady: ready }),

      setOnline: (online) => set({ isOnline: online }),

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      setLastSync: (lastSyncAt) => set({ lastSyncAt }),

      toggleHaptic: () => set((s) => ({ hapticEnabled: !s.hapticEnabled })),

      triggerHaptic: (style) => {
        if (!get().hapticEnabled) return;
        const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
        if (!tg?.HapticFeedback) return;
        switch (style) {
          case 'light':
          case 'medium':
          case 'heavy':
            tg.HapticFeedback.impactOccurred(style);
            break;
          case 'success':
          case 'error':
          case 'warning':
            tg.HapticFeedback.notificationOccurred(style);
            break;
        }
      },
    }),
    {
      name: 'cryptra-app-store',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        hapticEnabled: state.hapticEnabled,
      }),
    }
  )
);

