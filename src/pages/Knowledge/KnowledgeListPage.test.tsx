import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import KnowledgeListPage from './KnowledgeListPage';
import { mockKnowledgeBase } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { knowledgeService } from '@/services/knowledgeService';

vi.mock('@/services/knowledgeService', () => ({
  knowledgeService: {
    getList: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('KnowledgeListPage (Phase 3)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(knowledgeService.getList).mockResolvedValue({
      knowledge_bases: [mockKnowledgeBase],
      total: 1,
    });
  });

  it('renders knowledge list', async () => {
    renderAtRoute(<KnowledgeListPage />, { path: '/knowledge', route: '/knowledge' });
    expect(screen.getByRole('heading', { name: '知识库' })).toBeInTheDocument();
    await waitFor(() => {
      expect(knowledgeService.getList).toHaveBeenCalled();
      expect(screen.getByText('产品文档')).toBeInTheDocument();
    });
  });
});
