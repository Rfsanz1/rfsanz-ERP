'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import materioTheme from './materioTheme';

export function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={materioTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
