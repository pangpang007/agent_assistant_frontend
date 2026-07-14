import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import AgentDetailPage from './AgentDetailPage';
import { mockAgent } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { agentService } from '@/services/agentService';
import { toolService } from '@/services/toolService';

vi.mock('@/services/agentService', () => ({
  agentService: {
    getById: vi.fn(),
    duplicate: vi.fn(),
  },
}));

vi.mock('@/services/toolService', () => ({
  toolService: {
    getList: vi.fn(),
  },
}));

describe('AgentDetailPage (Phase 2)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(agentService.getById).mockResolvedValue(mockAgent);
    vi.mocked(toolService.getList).mockResolvedValue({ tools: [], total: 0 });
  });

  it('renders preset agent details', async () => {
    renderAtRoute(<AgentDetailPage />, {
      path: '/agents/:id/view',
      route: '/agents/agent-1/view',
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '前端工程师' })).toBeInTheDocument();
    });
  });
});
