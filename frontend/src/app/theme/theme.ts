import { createTheme } from '@mui/material/styles';

/**
 * MUI theme — единственный источник палитры для компонентов MUI (sx, palette).
 * Семантика Copper / Rosy Gold согласована с `shared/styles/variables.scss`.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#b87333',
      light: '#d4a574',
      dark: '#8f5526',
    },
    secondary: {
      main: '#b76e79',
      light: '#c88a93',
      dark: '#a85f6a',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#2b2b2b',
      secondary: '#6b6b6b',
      disabled: '#a1a1a1',
    },
    divider: '#e2e2e2',
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
    info: {
      main: '#1565c0',
    },
    grey: {
      50: '#fafafa',
      100: '#f7f7f7',
      200: '#e2e2e2',
      300: '#cfcfcf',
      400: '#a1a1a1',
      500: '#6b6b6b',
      600: '#6b6b6b',
      700: '#4a4a4a',
      800: '#2b2b2b',
      900: '#2b2b2b',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      '"Inter", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
        sizeLarge: { paddingTop: 10, paddingBottom: 10, fontSize: '1rem' },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#a6652d',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow:
            '0 1px 2px var(--color-shadow-soft), 0 4px 12px var(--color-shadow-medium)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--color-primary)',
            boxShadow: '0 0 0 2px var(--color-focus-ring)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid',
          borderColor: 'var(--color-border)',
        },
      },
    },
    MuiLink: {
      defaultProps: {
        color: 'primary',
      },
    },
  },
});
