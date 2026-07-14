import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import TeamSettingsPage from './TeamSettingsPage';
import { mockTeamOwner, mockUser, renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { teamService } from '@/services/teamService';

vi.mock('@/services/teamService', () => ({
  teamService: {
    getTeamInfo: vi.fn(),
    getMembers: vi.fn(),
    joinTeam: vi.fn(),
    removeMember: vi.fn(),
    resetInviteCode: vi.fn(),
  },
}));

vi.mock('@/services/userService', () => ({
  userService: {
    getProfile: vi.fn(),
  },
}));

describe('TeamSettingsPage (Phase 1)', () => {
  beforeEach(() => {
    vi.mocked(teamService.getTeamInfo).mockResolvedValue({
      team: {
        id: 'team-1',
        name: '测试团队',
        owner_id: 'user-1',
        owner_name: '测试用户',
        member_count: 1,
        created_at: '2025-01-01T00:00:00Z',
      },
      invite_code: 'INVITE123',
    });
    vi.mocked(teamService.getMembers).mockResolvedValue({
      members: [
        {
          id: 'member-1',
          user_id: 'user-1',
          username: '测试用户',
          email: 'dev@example.com',
          avatar_url: null,
          role: 'owner',
          joined_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
  });

  it('shows join team entry for personal users', () => {
    setAuthenticatedUser(mockUser);
    renderAtRoute(<TeamSettingsPage />, { path: '/settings/team', route: '/settings/team' });
    expect(screen.getByRole('heading', { name: '团队管理' })).toBeInTheDocument();
    expect(screen.getByText('加入团队')).toBeInTheDocument();
  });

  it('loads members and invite code for team owner', async () => {
    setAuthenticatedUser(mockTeamOwner);
    renderAtRoute(<TeamSettingsPage />, { path: '/settings/team', route: '/settings/team' });
    expect(screen.getByRole('heading', { name: '团队管理' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('INVITE123')).toBeInTheDocument();
    });
  });
});
