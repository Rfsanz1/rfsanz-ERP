import { createTheme } from '@mui/material/styles';

const materioTheme = createTheme({
  palette: {
    primary: {
      main: '#7367F0',
      light: '#9E95F5',
      dark: '#5E50EE',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#82868B',
      light: '#9B9FA4',
      dark: '#676D72',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#28C76F',
      light: '#48DA89',
      dark: '#1F9D57',
    },
    warning: {
      main: '#FF9F43',
      light: '#FFB976',
      dark: '#E08C3B',
    },
    error: {
      main: '#EA5455',
      light: '#ED6F70',
      dark: '#CE3A3B',
    },
    info: {
      main: '#00CFE8',
      light: '#1CE7F1',
      dark: '#00B8CF',
    },
    background: {
      default: '#F5F5F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#433C50',
      secondary: '#6D6777',
      disabled: '#A5A3AE',
    },
    divider: '#EDE7F6',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2rem', color: '#433C50' },
    h2: { fontWeight: 700, fontSize: '1.75rem', color: '#433C50' },
    h3: { fontWeight: 600, fontSize: '1.5rem', color: '#433C50' },
    h4: { fontWeight: 600, fontSize: '1.25rem', color: '#433C50' },
    h5: { fontWeight: 600, fontSize: '1.1rem', color: '#433C50' },
    h6: { fontWeight: 600, fontSize: '1rem', color: '#433C50' },
    subtitle1: { fontSize: '0.875rem', color: '#6D6777' },
    subtitle2: { fontSize: '0.8125rem', color: '#6D6777' },
    body1: { fontSize: '0.9375rem', color: '#433C50' },
    body2: { fontSize: '0.875rem', color: '#6D6777' },
    caption: { fontSize: '0.75rem', color: '#A5A3AE' },
    button: { fontWeight: 500, textTransform: 'none' as const },
  },
  shape: {
    borderRadius: 6,
  },
  shadows: [
    'none',
    '0 2px 6px rgba(47, 43, 61, 0.08)',
    '0 2px 12px rgba(47, 43, 61, 0.12)',
    '0 4px 16px rgba(47, 43, 61, 0.14)',
    '0 4px 18px rgba(47, 43, 61, 0.16)',
    '0 6px 20px rgba(47, 43, 61, 0.18)',
    '0 6px 24px rgba(47, 43, 61, 0.20)',
    '0 8px 24px rgba(47, 43, 61, 0.22)',
    '0 8px 28px rgba(47, 43, 61, 0.22)',
    '0 8px 30px rgba(47, 43, 61, 0.24)',
    '0 10px 32px rgba(47, 43, 61, 0.24)',
    '0 10px 34px rgba(47, 43, 61, 0.26)',
    '0 12px 36px rgba(47, 43, 61, 0.26)',
    '0 12px 38px rgba(47, 43, 61, 0.28)',
    '0 14px 40px rgba(47, 43, 61, 0.28)',
    '0 14px 42px rgba(47, 43, 61, 0.30)',
    '0 16px 44px rgba(47, 43, 61, 0.30)',
    '0 16px 46px rgba(47, 43, 61, 0.32)',
    '0 18px 48px rgba(47, 43, 61, 0.32)',
    '0 18px 50px rgba(47, 43, 61, 0.34)',
    '0 20px 52px rgba(47, 43, 61, 0.34)',
    '0 20px 54px rgba(47, 43, 61, 0.36)',
    '0 22px 56px rgba(47, 43, 61, 0.36)',
    '0 22px 58px rgba(47, 43, 61, 0.38)',
    '0 24px 60px rgba(47, 43, 61, 0.40)',
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 6px rgba(47, 43, 61, 0.08)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 20px',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          marginBottom: 2,
          '&.Mui-selected': {
            backgroundColor: 'rgba(115, 103, 240, 0.08)',
            color: '#7367F0',
            '&:hover': {
              backgroundColor: 'rgba(115, 103, 240, 0.12)',
            },
            '& .MuiListItemIcon-root': {
              color: '#7367F0',
            },
            '& .MuiListItemText-primary': {
              color: '#7367F0',
              fontWeight: 600,
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(115, 103, 240, 0.04)',
          },
        },
      },
    },
  },
});

export default materioTheme;
