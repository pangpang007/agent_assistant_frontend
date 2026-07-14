import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from './ProfilePage';
import { mockUser, renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { userService } from '@/services/userService';

vi.mock('@/services/userService', () => ({
  userService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

describe('ProfilePage (Phase 1)', () => {
  beforeEach(() => {
    setAuthenticatedUser(mockUser);
    vi.mocked(userService.updateProfile).mockResolvedValue({ ...mockUser, username: '新用户' });
  });

  it('renders profile fields for current user', () => {
    renderAtRoute(<ProfilePage />, { path: '/settings/profile', route: '/settings/profile' });
    expect(screen.getByRole('heading', { name: '个人资料' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('测试用户')).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
  });

  it('disables save when username is invalid', async () => {
    const user = userEvent.setup();
    renderAtRoute(<ProfilePage />, { path: '/settings/profile', route: '/settings/profile' });
    const input = screen.getByDisplayValue('测试用户');
    await user.clear(input);
    await user.type(input, 'a');
    expect(screen.getByRole('button', { name: '保存修改' })).toBeDisabled();
  });
});
