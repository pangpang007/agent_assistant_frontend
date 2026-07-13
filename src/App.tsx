import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';
import { router } from '@/router';
import './App.css';

export function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="app-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
