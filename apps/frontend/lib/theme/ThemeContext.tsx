'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
}

const LS_KEY = 'erp_theme_mode';

const ThemeContext = createContext<ThemeContextValue>({ mode: 'light', toggle: () => {} });

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LS_KEY);
      if (saved === 'dark' || saved === 'light') setMode(saved);
    } catch {}
  }, []);

  const toggle = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      try { window.localStorage.setItem(LS_KEY, next); } catch {}
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
