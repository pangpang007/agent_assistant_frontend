import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';
import './AuthGuard.css';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Protects routes that require a logged-in session (Cookie auth).
 * App.tsx already runs checkAuth on boot; this mainly gates on isAuthenticated.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized || isLoading) {
    return (
      <div className="auth-guard-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
