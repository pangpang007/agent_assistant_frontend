import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/pages/Error/ErrorBoundary';
import { App } from '@/App';
import '@/styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
