import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import AgentFormPage from './AgentFormPage';
import { mockAgent } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { agentService } from '@/services/agentService';
import { modelService } from '@/services/modelService';
import { toolService } from '@/services/toolService';

vi.mock('@/services/agentService', () => ({
  agentService: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/services/modelService', () => ({
  modelService: {
    getEnabledModels: vi.fn(),
  },
}));

vi.mock('@/services/toolService', () => ({
  toolService: {
    getList: vi.fn(),
  },
}));

describe('AgentFormPage (Phase 2)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(agentService.getById).mockResolvedValue(mockAgent);
    vi.mocked(modelService.getEnabledModels).mockResolvedValue({
      models: [{ id: 'model-1', name: 'gpt-4o', supplier_name: 'OpenAI' }],
    });
    vi.mocked(toolService.getList).mockResolvedValue({ tools: [], total: 0 });
  });

  it('renders create agent form', async () => {
    renderAtRoute(<AgentFormPage />, { path: '/agents/create', route: '/agents/create' });
    expect(screen.getByRole('heading', { name: '创建 Agent' })).toBeInTheDocument();
    expect(await screen.findByLabelText(/名称/)).toBeInTheDocument();
  });

  it('loads agent for edit mode', async () => {
    renderAtRoute(<AgentFormPage />, {
      path: '/agents/:id/edit',
      route: '/agents/agent-1/edit',
    });
    expect(await screen.findByRole('heading', { name: '编辑 Agent' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('前端工程师')).toBeInTheDocument();
  });
});
