import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface AuthRouteGuardProps {
  children: ReactNode;
}

export function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialized = useAuthStore((s) => s.initialized);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [initialized, isAuthenticated, isLoading, navigate]);

  if (!initialized || isLoading || isAuthenticated) return null;

  return <>{children}</>;
}
