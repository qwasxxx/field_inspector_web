import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

type Props = { children: ReactNode };

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3, maxWidth: 640, mx: 'auto', mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Ошибка при отрисовке интерфейса
            </Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
              {this.state.error.message}
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Откройте консоль разработчика (F12) — там полный стек. Частые причины: конфликт порта Vite
            (закройте старый процесс и снова запустите <code>npm run dev</code> в каталоге{' '}
            <code>frontend</code>), устаревший кэш — попробуйте жёсткое обновление (Ctrl+Shift+R).
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Обновить страницу
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
