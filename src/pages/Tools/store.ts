import { createListStore } from '@/stores/listStoreFactory';
import { toolService } from '@/services/toolService';
import { toListResponse } from '@/utils/listAdapter';
import type { CreateToolRequest, Tool, UpdateToolRequest } from '@/types';
import type { ListQueryParams } from '@/types/list';

async function listTools(params: ListQueryParams) {
  const type = typeof params.type === 'string' && params.type !== 'all' ? params.type : undefined;
  const res = await toolService.getList({
    type: type as 'preset' | 'custom' | undefined,
    search: params.keyword || undefined,
    page: params.page,
    page_size: params.pageSize,
  });
  return toListResponse(res.tools, res.total, params);
}

export const useToolListStore = createListStore<Tool, CreateToolRequest, UpdateToolRequest>({
  api: {
    list: listTools,
    create: (input) => toolService.create(input),
    remove: (id) => toolService.delete(id),
    update: (id, input) => toolService.update(id, input),
  },
  defaultPageSize: 20,
  defaultSort: { sortBy: 'created_at', sortOrder: 'desc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'optimistic',
  createInsertPosition: 'prepend',
  updateStrategy: 'refetch',
});
