import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ToolTestPage from './ToolTestPage';
import { mockTool } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { toolService } from '@/services/toolService';

vi.mock('@/services/toolService', () => ({
  toolService: {
    getById: vi.fn(),
    testTool: vi.fn(),
  },
}));

describe('ToolTestPage (Phase 2)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(toolService.getById).mockResolvedValue(mockTool);
    vi.mocked(toolService.testTool).mockResolvedValue({
      status: 200,
      status_text: 'OK',
      data: { ok: true },
      duration_ms: 12,
      request_details: { method: 'GET', url: 'https://api.example.com', headers: {} },
    });
  });

  it('renders tool test page with parameters', async () => {
    renderAtRoute(<ToolTestPage />, {
      path: '/tools/:id/test',
      route: '/tools/tool-1/test',
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /测试工具：天气查询/ })).toBeInTheDocument();
      expect(screen.getByText('city')).toBeInTheDocument();
    });
  });
});
