import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import WorkflowListPage from './WorkflowListPage';
import { mockWorkflowItem } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { workflowService } from '@/services/workflowService';

vi.mock('@/services/workflowService', () => ({
  workflowService: {
    getList: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    duplicate: vi.fn(),
  },
  default: {
    getList: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    duplicate: vi.fn(),
  },
}));

describe('WorkflowListPage (Phase 4)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(workflowService.getList).mockResolvedValue({
      workflows: [mockWorkflowItem],
      total: 1,
    });
  });

  it('renders workflow list', async () => {
    renderAtRoute(<WorkflowListPage />, { path: '/workflows', route: '/workflows' });
    expect(screen.getByRole('heading', { name: '工作流' })).toBeInTheDocument();
    await waitFor(() => {
      expect(workflowService.getList).toHaveBeenCalled();
      expect(screen.getByText('示例工作流')).toBeInTheDocument();
    });
  });
});
