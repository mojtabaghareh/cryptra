import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('cryptra-theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);

    setResolvedTheme(isDark ? 'dark' : 'light');
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    document.body.style.background = isDark ? '#0a0a0f' : '#f8fafc';
    document.body.style.color = isDark ? '#f0f0f5' : '#0a0a0f';

    try {
      const tg = (window as unknown as { Telegram?: { WebApp?: { setHeaderColor?: (c: string) => void; setBackgroundColor?: (c: string) => void } } })
        .Telegram?.WebApp;
      tg?.setHeaderColor?.(isDark ? '#0a0a0f' : '#f8fafc');
      tg?.setBackgroundColor?.(isDark ? '#0a0a0f' : '#f8fafc');
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('cryptra-theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
