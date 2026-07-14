import { createListStore } from '@/stores/listStoreFactory';
import { workflowService } from '@/services/workflowService';
import { toListResponse } from '@/utils/listAdapter';
import type { CreateWorkflowRequest, UpdateWorkflowRequest, Workflow, WorkflowListItem } from '@/types';
import type { ListQueryParams } from '@/types/list';

function toListItem(wf: Workflow): WorkflowListItem {
  return {
    id: wf.id,
    name: wf.name,
    description: wf.description ?? '',
    node_count: wf.nodes?.length ?? 0,
    edge_count: wf.edges?.length ?? 0,
    current_version: wf.current_version,
    status: wf.status,
    created_at: wf.created_at,
    updated_at: wf.updated_at,
  };
}

async function listWorkflows(params: ListQueryParams) {
  const sortBy = (params.sortBy || 'updated_at') as 'name' | 'updated_at' | 'created_at';
  const res = await workflowService.getList({
    search: params.keyword || undefined,
    sort_by: sortBy,
    sort_order: params.sortOrder ?? 'desc',
    page: params.page,
    page_size: params.pageSize,
  });
  return toListResponse(res.workflows, res.total, params);
}

export const useWorkflowListStore = createListStore<
  WorkflowListItem,
  CreateWorkflowRequest,
  UpdateWorkflowRequest
>({
  api: {
    list: listWorkflows,
    create: async (input) => toListItem(await workflowService.create(input)),
    remove: (id) => workflowService.delete(id),
    update: async (id, input) => toListItem(await workflowService.update(id, input)),
  },
  defaultPageSize: 20,
  defaultSort: { sortBy: 'updated_at', sortOrder: 'desc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'optimistic',
  createInsertPosition: 'prepend',
  updateStrategy: 'optimistic',
});
