import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from './RegisterPage';
import { renderAtRoute, resetAuthStore } from '@/test/render';

vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn().mockResolvedValue({ message: 'ok' }),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

describe('RegisterPage (Phase 1)', () => {
  beforeEach(() => {
    resetAuthStore({ isLoading: false, isAuthenticated: false });
  });

  it('renders personal register form without team name', () => {
    renderAtRoute(<RegisterPage />, { path: '/register', route: '/register' });
    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/用户名/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/团队名称/)).not.toBeInTheDocument();
  });

  it('shows team name when selecting team registration', async () => {
    const user = userEvent.setup();
    renderAtRoute(<RegisterPage />, { path: '/register', route: '/register' });
    const teamControl =
      screen.queryByRole('radio', { name: /团队/ }) ??
      screen.queryByRole('button', { name: /团队/ }) ??
      screen.getByText(/团队/);
    await user.click(teamControl);
    expect(await screen.findByLabelText(/团队名称/)).toBeInTheDocument();
  });
});
