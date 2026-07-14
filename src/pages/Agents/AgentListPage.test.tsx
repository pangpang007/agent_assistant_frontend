import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import AgentListPage from './AgentListPage';
import { mockAgent } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { agentService } from '@/services/agentService';

vi.mock('@/services/agentService', () => ({
  agentService: {
    getList: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
  },
}));

describe('AgentListPage (Phase 2)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(agentService.getList).mockResolvedValue({ agents: [mockAgent], total: 1 });
  });

  it('renders agent management and list items', async () => {
    renderAtRoute(<AgentListPage />, { path: '/agents', route: '/agents' });
    expect(screen.getByRole('heading', { name: 'Agent 管理' })).toBeInTheDocument();
    await waitFor(() => {
      expect(agentService.getList).toHaveBeenCalled();
      expect(screen.getByText('前端工程师')).toBeInTheDocument();
    });
  });

  it('shows empty state when list is empty', async () => {
    vi.mocked(agentService.getList).mockResolvedValueOnce({ agents: [], total: 0 });
    renderAtRoute(<AgentListPage />, { path: '/agents', route: '/agents' });
    await waitFor(() => {
      expect(screen.getByText('暂无 Agent')).toBeInTheDocument();
    });
  });
});
