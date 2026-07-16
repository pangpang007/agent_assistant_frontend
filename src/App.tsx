import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';
import { router } from '@/router';
import './App.css';

export function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  if (!initialized) {
    return (
      <div className="app-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
