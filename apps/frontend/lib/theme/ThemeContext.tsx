'use client';

import { createContext, useContext, ReactNode } from 'react';

type ThemeMode = 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'light', toggle: () => {} });

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ mode: 'light', toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
