import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TelegramUser } from '../types';

interface UserState {
  user: TelegramUser | null;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  preferences: {
    notifications: boolean;
    biometricAuth: boolean;
    autoLock: boolean;
  };
}

interface UserActions {
  setUser: (user: TelegramUser | null) => void;
  setAuthenticated: (auth: boolean) => void;
  completeOnboarding: () => void;
  updatePreferences: (prefs: Partial<UserState['preferences']>) => void;
  logout: () => void;
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      onboardingCompleted: false,
      preferences: {
        notifications: true,
        biometricAuth: false,
        autoLock: true,
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      updatePreferences: (prefs) =>
        set((s) => ({
          preferences: { ...s.preferences, ...prefs },
        })),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          onboardingCompleted: false,
        }),
    }),
    {
      name: 'cryptra-user-store',
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        preferences: state.preferences,
      }),
    }
  )
);

