import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppRouter } from '@/app/router';
import '@/shared/styles/variables.scss';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);
