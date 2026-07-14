import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ToolFormPage from './ToolFormPage';
import { mockTool } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { toolService } from '@/services/toolService';

vi.mock('@/services/toolService', () => ({
  toolService: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    parseSwagger: vi.fn(),
  },
}));

describe('ToolFormPage (Phase 2)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(toolService.getById).mockResolvedValue(mockTool);
  });

  it('renders create custom tool page', () => {
    renderAtRoute(<ToolFormPage />, { path: '/tools/create', route: '/tools/create' });
    expect(screen.getByRole('heading', { name: '创建自定义工具' })).toBeInTheDocument();
  });

  it('loads tool for edit', async () => {
    renderAtRoute(<ToolFormPage />, {
      path: '/tools/:id/edit',
      route: '/tools/tool-1/edit',
    });
    expect(await screen.findByRole('heading', { name: '编辑工具' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('天气查询')).toBeInTheDocument();
  });
});
