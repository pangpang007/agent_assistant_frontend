import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import type { UserInfo } from '@/types';

export const mockUser: UserInfo = {
  id: 'user-1',
  email: 'dev@example.com',
  username: '测试用户',
  avatar_url: null,
  user_type: 'personal',
  role: 'personal',
  team_id: null,
  team_name: null,
  created_at: '2025-01-01T00:00:00Z',
};

export const mockTeamOwner: UserInfo = {
  ...mockUser,
  user_type: 'team',
  role: 'team_owner',
  team_id: 'team-1',
  team_name: '测试团队',
};

const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export function clearTestQueryClient() {
  testQueryClient.clear();
}

export function resetAuthStore(overrides?: Partial<ReturnType<typeof useAuthStore.getState>>) {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    ...overrides,
  });
}

export function setAuthenticatedUser(user: UserInfo = mockUser) {
  resetAuthStore({
    user,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    isAuthenticated: true,
    isLoading: false,
  });
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={testQueryClient}>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    wrapper: ({ children }) => <Providers>{children}</Providers>,
    ...options,
  });
}

/** Data router required for useParams / useBlocker pages. */
export function renderAtRoute(
  element: ReactElement,
  {
    path,
    route,
    extraRoutes = [],
  }: {
    path: string;
    route: string;
    extraRoutes?: Array<{ path: string; element: ReactElement }>;
  },
) {
  const router = createMemoryRouter(
    [{ path, element }, ...extraRoutes, { path: '*', element: <div>fallback</div> }],
    { initialEntries: [route] },
  );

  return render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
}
