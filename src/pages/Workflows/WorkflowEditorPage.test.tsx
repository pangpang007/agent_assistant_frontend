import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import WorkflowEditorPage from './WorkflowEditorPage';
import { mockWorkflow } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { workflowService } from '@/services/workflowService';

vi.mock('@/components/workflow/WorkflowCanvas', () => ({
  WorkflowCanvas: () => <div data-testid="workflow-canvas" />,
}));
vi.mock('@/components/workflow/NodeLibrary', () => ({
  NodeLibrary: () => <div data-testid="node-library" />,
}));
vi.mock('@/components/workflow/PropertiesPanel', () => ({
  PropertiesPanel: () => <div data-testid="properties-panel" />,
}));
vi.mock('@/components/workflow/WorkflowToolbar', () => ({
  WorkflowToolbar: () => <div data-testid="workflow-toolbar" />,
}));
vi.mock('@/components/workflow/WorkflowStatusBar', () => ({
  WorkflowStatusBar: () => <div data-testid="workflow-status" />,
}));
vi.mock('@/components/workflow/ContextMenu', () => ({
  ContextMenu: () => null,
}));
vi.mock('@/hooks/useWorkflowShortcuts', () => ({
  useWorkflowShortcuts: () => undefined,
}));
vi.mock('@/hooks/useWorkflowWebSocket', () => ({
  useWorkflowWebSocket: () => undefined,
}));

vi.mock('@/services/workflowService', () => ({
  workflowService: {
    create: vi.fn(),
    getById: vi.fn(),
    getVersions: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    run: vi.fn(),
    getVersion: vi.fn(),
  },
  default: {
    create: vi.fn(),
    getById: vi.fn(),
    getVersions: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    run: vi.fn(),
    getVersion: vi.fn(),
  },
}));

describe('WorkflowEditorPage (Phase 4)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(workflowService.create).mockResolvedValue(mockWorkflow);
    vi.mocked(workflowService.getById).mockResolvedValue(mockWorkflow);
    vi.mocked(workflowService.getVersions).mockResolvedValue([]);
  });

  it('creates workflow when route id is new', async () => {
    renderAtRoute(<WorkflowEditorPage />, {
      path: '/workflows/:id',
      route: '/workflows/new',
      extraRoutes: [
        { path: '/workflows', element: <div>列表</div> },
      ],
    });
    await waitFor(() => {
      expect(workflowService.create).toHaveBeenCalled();
    });
  });

  it('loads existing workflow by id', async () => {
    renderAtRoute(<WorkflowEditorPage />, {
      path: '/workflows/:id',
      route: '/workflows/wf-1',
    });
    await waitFor(() => {
      expect(workflowService.getById).toHaveBeenCalledWith('wf-1');
    });
    expect(await screen.findByTestId('workflow-canvas')).toBeInTheDocument();
  });
});
