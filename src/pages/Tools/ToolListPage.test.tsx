import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ToolListPage from './ToolListPage';
import { mockTool } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { toolService } from '@/services/toolService';

vi.mock('@/services/toolService', () => ({
  toolService: {
    getList: vi.fn(),
    getReferences: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ToolListPage (Phase 2)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(toolService.getList).mockResolvedValue({ tools: [mockTool], total: 1 });
  });

  it('renders tool management and items', async () => {
    renderAtRoute(<ToolListPage />, { path: '/tools', route: '/tools' });
    expect(screen.getByRole('heading', { name: '工具管理' })).toBeInTheDocument();
    await waitFor(() => {
      expect(toolService.getList).toHaveBeenCalled();
      expect(screen.getByText('天气查询')).toBeInTheDocument();
    });
  });
});
