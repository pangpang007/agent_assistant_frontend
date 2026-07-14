import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import { clearTestQueryClient, mockUser, renderAtRoute, setAuthenticatedUser } from '@/test/render';

vi.mock('@/services/dashboardService', () => ({
  dashboardService: {
    getStats: vi.fn().mockResolvedValue({
      workflowCount: 12,
      agentCount: 8,
      knowledgeBaseCount: 3,
      monthlyExecutions: 156,
      successRate: 94.2,
    }),
    getTokenTrend: vi.fn().mockResolvedValue([
      { date: '2026-07-08', label: '一', tokens: 1200 },
      { date: '2026-07-09', label: '二', tokens: 3400 },
    ]),
    getRecentWorkflows: vi.fn().mockResolvedValue([
      {
        id: 'wf-1',
        name: '代码审查流水线',
        description: '',
        node_count: 5,
        current_version: 3,
        status: 'draft',
        created_at: '2026-07-01T00:00:00Z',
        updated_at: '2026-07-14T00:00:00Z',
      },
    ]),
    getRecentExecutions: vi.fn().mockResolvedValue([
      {
        id: 'exec-1',
        workflow_id: 'wf-1',
        workflow_name: '代码审查流水线',
        version_number: 3,
        status: 'success',
        input_data: {},
        output_data: {},
        total_duration_ms: 12300,
        total_tokens: 3450,
        total_cost: null,
        started_at: '2026-07-14T00:00:00Z',
        finished_at: '2026-07-14T00:00:20Z',
        trigger_type: 'manual',
      },
    ]),
  },
}));

describe('DashboardPage (Phase 7)', () => {
  beforeEach(() => {
    clearTestQueryClient();
    setAuthenticatedUser(mockUser);
  });

  it('renders dashboard header, stats and sections', async () => {
    renderAtRoute(<DashboardPage />, { path: '/dashboard', route: '/dashboard' });

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText(/欢迎回来，测试用户/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /新建工作流/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /从模板创建/ })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('工作流总数')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    expect(screen.getByText('最近工作流')).toBeInTheDocument();
    expect(screen.getByText('最近执行记录')).toBeInTheDocument();
    expect(screen.getByText('Token 消耗趋势')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText('代码审查流水线').length).toBeGreaterThan(0);
    });
  });
});
