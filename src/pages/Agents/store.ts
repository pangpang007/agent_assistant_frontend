import { createListStore } from '@/stores/listStoreFactory';
import { agentService } from '@/services/agentService';
import { toListResponse } from '@/utils/listAdapter';
import type { Agent, CreateAgentRequest, UpdateAgentRequest } from '@/types';
import type { ListQueryParams } from '@/types/list';

async function listAgents(params: ListQueryParams) {
  const type = typeof params.type === 'string' && params.type !== 'all' ? params.type : undefined;
  const res = await agentService.getList({
    type: type as 'preset' | 'custom' | undefined,
    search: params.keyword || undefined,
    sort_by: (params.sortBy as 'name' | 'created_at' | 'updated_at') || 'created_at',
    sort_order: params.sortOrder ?? 'desc',
    page: params.page,
    page_size: params.pageSize,
  });
  return toListResponse(res.agents, res.total, params);
}

export const useAgentListStore = createListStore<Agent, CreateAgentRequest, UpdateAgentRequest>({
  api: {
    list: listAgents,
    create: (input) => agentService.create(input),
    remove: (id) => agentService.delete(id),
    update: (id, input) => agentService.update(id, input),
  },
  defaultPageSize: 20,
  defaultSort: { sortBy: 'created_at', sortOrder: 'desc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'optimistic',
  createInsertPosition: 'prepend',
  updateStrategy: 'optimistic',
});
