import http from '@/lib/axios';
import { asArray, pickList } from '@/lib/arrayUtils';
import type {
  CreateWorkflowRequest,
  RunWorkflowRequest,
  RunWorkflowResponse,
  SaveWorkflowRequest,
  SaveWorkflowResponse,
  TestNodeRequest,
  TestNodeResponse,
  UpdateWorkflowRequest,
  ValidateWorkflowResponse,
  Workflow,
  WorkflowListItem,
  WorkflowListParams,
  WorkflowListResponse,
  WorkflowVersion,
} from '@/types';

type BackendWorkflow = Workflow & {
  nodes_data?: Workflow['nodes'];
  edges_data?: Workflow['edges'];
};

function normalizeWorkflow(raw: BackendWorkflow | null | undefined): Workflow {
  const base = (raw ?? {}) as BackendWorkflow;
  const nodes = asArray<Workflow['nodes'][number]>(
    base.nodes?.length ? base.nodes : base.nodes_data,
  );
  const edges = asArray<Workflow['edges'][number]>(
    base.edges?.length ? base.edges : base.edges_data,
  );
  return {
    ...base,
    nodes,
    edges,
  };
}

export const workflowService = {
  getList: async (params?: WorkflowListParams): Promise<WorkflowListResponse> => {
    const res = await http.get('/workflows', { params });
    const workflows = pickList<WorkflowListItem>(res, [
      'workflows',
      'items',
      'results',
    ]);
    const total =
      res && typeof res === 'object' && !Array.isArray(res)
        ? Number((res as { total?: number }).total ?? workflows.length)
        : workflows.length;
    return { workflows, total };
  },

  getById: async (id: string): Promise<Workflow> =>
    normalizeWorkflow(await http.get(`/workflows/${id}`)),

  create: async (data: CreateWorkflowRequest): Promise<Workflow> =>
    normalizeWorkflow(await http.post('/workflows', data)),

  update: async (id: string, data: UpdateWorkflowRequest): Promise<Workflow> => {
    const payload = {
      name: data.name,
      description: data.description,
      nodes_data: data.nodes,
      edges_data: data.edges,
    };
    return normalizeWorkflow(await http.put(`/workflows/${id}`, payload));
  },

  delete: (id: string): Promise<void> => http.delete(`/workflows/${id}`),

  /** Persist graph via PUT update (no dedicated /save in OpenAPI). */
  save: async (id: string, data: SaveWorkflowRequest): Promise<SaveWorkflowResponse> => {
    const workflow = await workflowService.update(id, {
      nodes: data.nodes,
      edges: data.edges,
    });
    return {
      version: {
        id: String(workflow.current_version),
        version: workflow.current_version,
        note: data.note,
        node_count: workflow.nodes.length,
        edge_count: workflow.edges.length,
        created_at: workflow.updated_at,
        created_by: '',
      },
    };
  },

  validate: async (id: string): Promise<ValidateWorkflowResponse> => {
    const res = await http.post(`/workflows/${id}/validate`);
    const issues = pickList<ValidateWorkflowResponse['issues'][number]>(res, [
      'issues',
      'errors',
      'items',
      'results',
    ]);
    const valid =
      res && typeof res === 'object' && !Array.isArray(res)
        ? Boolean((res as { valid?: boolean }).valid ?? issues.length === 0)
        : issues.length === 0;
    return { valid, issues };
  },

  /** OpenAPI currently has no /run; keep path for when backend adds it. */
  run: (id: string, data: RunWorkflowRequest): Promise<RunWorkflowResponse> =>
    http.post(`/workflows/${id}/run`, data),

  testNode: (id: string, data: TestNodeRequest): Promise<TestNodeResponse> =>
    http.post(`/workflows/${id}/nodes/test`, {
      node_id: data.nodeId,
      node_type: (data as TestNodeRequest & { nodeType?: string }).nodeType ?? 'agent',
      config: {},
      input_variables: data.inputs,
    }),

  export: (id: string): Promise<Record<string, unknown>> => http.get(`/workflows/${id}/export`),

  import: async (file: File): Promise<Workflow> => {
    const formData = new FormData();
    formData.append('file', file);
    return normalizeWorkflow(
      await http.post('/workflows/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },

  getVersions: async (id: string): Promise<WorkflowVersion[]> => {
    const res = await http.get(`/workflows/${id}/versions`);
    return pickList<WorkflowVersion>(res, ['versions', 'items', 'results']);
  },

  getVersion: async (id: string, version: number): Promise<Workflow> =>
    normalizeWorkflow(await http.get(`/workflows/${id}/versions/${version}`)),

  rollbackVersion: async (id: string, version: number): Promise<Workflow> =>
    normalizeWorkflow(await http.post(`/workflows/${id}/versions/${version}/rollback`)),

  duplicate: async (id: string): Promise<Workflow> => {
    const source = await workflowService.getById(id);
    return workflowService
      .create({
        name: `${source.name} (副本)`,
        description: source.description,
      })
      .then(async (created) =>
        workflowService.update(created.id, {
          nodes: source.nodes,
          edges: source.edges,
        }),
      );
  },
};

export default workflowService;
