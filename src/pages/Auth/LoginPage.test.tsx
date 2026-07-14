import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { mockUser, renderAtRoute, resetAuthStore } from '@/test/render';

vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock('@/lib/authStorage', () => ({
  authStorage: {
    setTokens: vi.fn(),
    setUser: vi.fn(),
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    getUser: vi.fn(),
    clear: vi.fn(),
  },
}));

import { authService } from '@/services/authService';

describe('LoginPage (Phase 1)', () => {
  beforeEach(() => {
    resetAuthStore({ isLoading: false, isAuthenticated: false });
    vi.mocked(authService.login).mockResolvedValue({
      access_token: 'a',
      refresh_token: 'r',
      token_type: 'bearer',
      user: mockUser,
    });
  });

  it('renders login form with email, password and submit', () => {
    renderAtRoute(<LoginPage />, { path: '/login', route: '/login' });
    expect(screen.getByLabelText(/邮箱地址/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密码$/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '立即注册' })).toBeInTheDocument();
  });

  it('shows email validation on blur', async () => {
    const user = userEvent.setup();
    renderAtRoute(<LoginPage />, { path: '/login', route: '/login' });
    await user.click(screen.getByLabelText(/邮箱地址/));
    await user.tab();
    expect(await screen.findByText('请输入邮箱地址')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderAtRoute(<LoginPage />, { path: '/login', route: '/login' });
    const password = screen.getByLabelText(/^密码$/);
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: '显示密码' }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('logs in successfully and navigates home', async () => {
    const user = userEvent.setup();
    renderAtRoute(<LoginPage />, {
      path: '/login',
      route: '/login',
      extraRoutes: [{ path: '/', element: <div>首页</div> }],
    });

    await user.type(screen.getByLabelText(/邮箱地址/), 'dev@example.com');
    await user.type(screen.getByLabelText(/^密码$/), 'Password1');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalled();
    });
    expect(await screen.findByText('首页')).toBeInTheDocument();
  });
});
