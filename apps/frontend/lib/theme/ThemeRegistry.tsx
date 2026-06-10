'use client';

import { ReactNode, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeModeProvider, useThemeMode } from './ThemeContext';
import { buildTheme } from './materioTheme';

function InnerRegistry({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode();
  const theme = useMemo(() => buildTheme(mode === 'dark'), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <ThemeModeProvider>
      <InnerRegistry>{children}</InnerRegistry>
    </ThemeModeProvider>
  );
}
