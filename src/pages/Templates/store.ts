import { createListStore } from '@/stores/listStoreFactory';
import { templateService } from '@/services/templateService';
import { toListResponse } from '@/utils/listAdapter';
import type { Template } from '@/types/phase6';
import type { ListQueryParams } from '@/types/list';

async function listTemplates(params: ListQueryParams) {
  const category =
    typeof params.category === 'string' && params.category !== 'all'
      ? params.category
      : undefined;
  const source = typeof params.source === 'string' ? params.source : 'all';
  const res = await templateService.getTemplates({
    keyword: params.keyword || undefined,
    category,
    is_official: source === 'all' ? undefined : source === 'official',
    page: params.page,
    page_size: params.pageSize,
  });
  return toListResponse(res.data, res.total, params);
}

export const useTemplateListStore = createListStore<Template, never, never>({
  api: {
    list: listTemplates,
    create: () => {
      throw new Error('Templates cannot be created from the library list');
    },
    remove: (id) => templateService.deleteTemplate(id),
    update: () => {
      throw new Error('Templates cannot be updated from the library list');
    },
  },
  defaultPageSize: 20,
  defaultSort: { sortBy: 'usageCount', sortOrder: 'desc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'refetch',
  updateStrategy: 'refetch',
});
