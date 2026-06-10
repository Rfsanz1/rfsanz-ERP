import { createTheme, Theme } from '@mui/material/styles';

const baseTypography = {
  fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  h1: { fontWeight: 800, fontSize: '2rem',    letterSpacing: '-0.02em' },
  h2: { fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.015em' },
  h3: { fontWeight: 700, fontSize: '1.5rem',  letterSpacing: '-0.01em' },
  h4: { fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em' },
  h5: { fontWeight: 600, fontSize: '1.1rem' },
  h6: { fontWeight: 600, fontSize: '1rem' },
  subtitle1: { fontSize: '0.9375rem', fontWeight: 500 },
  subtitle2: { fontSize: '0.875rem',  fontWeight: 500 },
  body1:     { fontSize: '0.9375rem', lineHeight: 1.65 },
  body2:     { fontSize: '0.875rem',  lineHeight: 1.6 },
  caption:   { fontSize: '0.75rem',   lineHeight: 1.5 },
  button:    { fontWeight: 600, textTransform: 'none' as const, letterSpacing: '0.01em' },
};

const baseShape = { borderRadius: 10 };

const baseShadows: Theme['shadows'] = [
  'none',
  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  '0 2px 6px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
  '0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  '0 4px 12px rgba(0,0,0,0.09), 0 2px 4px rgba(0,0,0,0.04)',
  '0 6px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)',
  '0 6px 20px rgba(0,0,0,0.10), 0 3px 6px rgba(0,0,0,0.05)',
  '0 8px 24px rgba(0,0,0,0.11), 0 3px 8px rgba(0,0,0,0.05)',
  '0 8px 28px rgba(0,0,0,0.11), 0 4px 8px rgba(0,0,0,0.05)',
  '0 10px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)',
  '0 10px 32px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)',
  '0 12px 36px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.06)',
  '0 12px 38px rgba(0,0,0,0.13), 0 5px 12px rgba(0,0,0,0.06)',
  '0 14px 40px rgba(0,0,0,0.14), 0 5px 14px rgba(0,0,0,0.07)',
  '0 14px 42px rgba(0,0,0,0.14), 0 5px 14px rgba(0,0,0,0.07)',
  '0 16px 44px rgba(0,0,0,0.15), 0 6px 16px rgba(0,0,0,0.07)',
  '0 16px 46px rgba(0,0,0,0.15), 0 6px 16px rgba(0,0,0,0.07)',
  '0 18px 48px rgba(0,0,0,0.16), 0 6px 18px rgba(0,0,0,0.08)',
  '0 18px 50px rgba(0,0,0,0.16), 0 6px 18px rgba(0,0,0,0.08)',
  '0 20px 52px rgba(0,0,0,0.17), 0 7px 20px rgba(0,0,0,0.08)',
  '0 20px 54px rgba(0,0,0,0.17), 0 7px 20px rgba(0,0,0,0.08)',
  '0 22px 56px rgba(0,0,0,0.18), 0 7px 22px rgba(0,0,0,0.09)',
  '0 22px 58px rgba(0,0,0,0.18), 0 8px 22px rgba(0,0,0,0.09)',
  '0 24px 60px rgba(0,0,0,0.19), 0 8px 24px rgba(0,0,0,0.09)',
  '0 24px 64px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.10)',
];

const components = (dark: boolean): Theme['components'] => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: dark ? '#0D1117' : '#F1F5F9',
        color: dark ? '#E6EDF3' : '#1E293B',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: dark ? 'rgba(22,27,34,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: 'none',
        color: dark ? '#E6EDF3' : '#1E293B',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: dark ? '#161B22' : '#FFFFFF',
        borderRight: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: dark ? '#161B22' : '#FFFFFF',
        borderRadius: 16,
        border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: dark
          ? '0 1px 3px rgba(0,0,0,0.3)'
          : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: 10, padding: '8px 20px', fontWeight: 600 },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 6, fontWeight: 600, fontSize: '0.7rem' },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        marginBottom: 2,
        '&.Mui-selected': {
          backgroundColor: 'rgba(99, 102, 241, 0.10)',
          color: '#6366F1',
          '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.14)' },
          '& .MuiListItemIcon-root': { color: '#6366F1' },
        },
        '&:hover': { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.05)' },
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: { borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        backgroundColor: dark ? '#1C2128' : '#FFFFFF',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: dark
          ? '0 8px 32px rgba(0,0,0,0.5)'
          : '0 8px 24px rgba(0,0,0,0.12)',
        borderRadius: 14,
      },
    },
  },
});

export function buildTheme(dark: boolean) {
  return createTheme({
    palette: {
      mode: dark ? 'dark' : 'light',
      primary:   { main: '#6366F1', light: '#818CF8', dark: '#4F46E5', contrastText: '#FFFFFF' },
      secondary: { main: '#64748B', light: '#94A3B8', dark: '#475569', contrastText: '#FFFFFF' },
      success:   { main: '#10B981', light: '#34D399', dark: '#059669' },
      warning:   { main: '#F59E0B', light: '#FCD34D', dark: '#D97706' },
      error:     { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
      info:      { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB' },
      background: {
        default: dark ? '#0D1117' : '#F1F5F9',
        paper:   dark ? '#161B22' : '#FFFFFF',
      },
      text: {
        primary:   dark ? '#E6EDF3' : '#1E293B',
        secondary: dark ? '#8B949E' : '#475569',
        disabled:  dark ? '#484F58' : '#94A3B8',
      },
      divider: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    },
    typography: baseTypography,
    shape:      baseShape,
    shadows:    baseShadows,
    components: components(dark),
  });
}

const materioTheme = buildTheme(false);
export default materioTheme;
