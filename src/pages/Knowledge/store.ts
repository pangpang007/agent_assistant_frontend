import { createListStore } from '@/stores/listStoreFactory';
import { knowledgeService } from '@/services/knowledgeService';
import { toListResponse } from '@/utils/listAdapter';
import type {
  CreateKnowledgeBaseRequest,
  KnowledgeBase,
  UpdateKnowledgeBaseRequest,
} from '@/types';
import type { ListQueryParams } from '@/types/list';

async function listKnowledge(params: ListQueryParams) {
  const res = await knowledgeService.getList({
    page: params.page,
    page_size: params.pageSize,
    keyword: params.keyword || undefined,
  });
  return toListResponse(res.knowledge_bases, res.total, params);
}

export const useKnowledgeListStore = createListStore<
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest
>({
  api: {
    list: listKnowledge,
    create: (input) => knowledgeService.create(input),
    remove: (id) => knowledgeService.delete(id),
    update: (id, input) => knowledgeService.update(id, input),
  },
  defaultPageSize: 20,
  defaultSort: { sortBy: 'updated_at', sortOrder: 'desc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'refetch',
  updateStrategy: 'optimistic',
});
