import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LogCenterPage from '@/pages/Logs/LogCenterPage';
import WorkflowHistoryPage from '@/pages/Workflows/WorkflowHistoryPage';
import WorkflowTemplatePage from '@/pages/Workflows/WorkflowTemplatePage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { renderAtRoute, renderWithProviders } from '@/test/render';

describe('Placeholder pages (Phase 0)', () => {
  it('PlaceholderPage renders title and description', () => {
    renderWithProviders(
      <MemoryRouter>
        <PlaceholderPage title="标题" description="描述内容" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: '标题' })).toBeInTheDocument();
    expect(screen.getByText('描述内容')).toBeInTheDocument();
  });

  it('WorkflowTemplatePage', () => {
    renderAtRoute(<WorkflowTemplatePage />, {
      path: '/workflows/templates',
      route: '/workflows/templates',
    });
    expect(screen.getByRole('heading', { name: '工作流模板' })).toBeInTheDocument();
  });

  it('WorkflowHistoryPage', () => {
    renderAtRoute(<WorkflowHistoryPage />, {
      path: '/workflows/history',
      route: '/workflows/history',
    });
    expect(screen.getByRole('heading', { name: '运行历史' })).toBeInTheDocument();
  });

  it('LogCenterPage', () => {
    renderAtRoute(<LogCenterPage />, { path: '/logs', route: '/logs' });
    expect(screen.getByRole('heading', { name: '日志中心' })).toBeInTheDocument();
  });
});
