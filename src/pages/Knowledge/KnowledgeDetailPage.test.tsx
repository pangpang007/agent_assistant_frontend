import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import KnowledgeDetailPage from './KnowledgeDetailPage';
import { mockKnowledgeBase } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { knowledgeService } from '@/services/knowledgeService';

vi.mock('@/services/knowledgeService', () => ({
  knowledgeService: {
    getById: vi.fn(),
    getDocuments: vi.fn(),
    update: vi.fn(),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    search: vi.fn(),
  },
}));

describe('KnowledgeDetailPage (Phase 3)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(knowledgeService.getById).mockResolvedValue(mockKnowledgeBase);
    vi.mocked(knowledgeService.getDocuments).mockResolvedValue({ documents: [], total: 0 });
  });

  it('renders knowledge detail with retrieval test section', async () => {
    renderAtRoute(<KnowledgeDetailPage />, {
      path: '/knowledge/:id',
      route: '/knowledge/kb-1',
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '产品文档' })).toBeInTheDocument();
    });
    expect(screen.getByText('检索测试')).toBeInTheDocument();
  });
});
