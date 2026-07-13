import http from '@/lib/axios';
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
  WorkflowListParams,
  WorkflowListResponse,
  WorkflowVersion,
} from '@/types';

type BackendWorkflow = Workflow & {
  nodes_data?: Workflow['nodes'];
  edges_data?: Workflow['edges'];
};

function normalizeWorkflow(raw: BackendWorkflow): Workflow {
  return {
    ...raw,
    nodes: raw.nodes?.length ? raw.nodes : (raw.nodes_data ?? []),
    edges: raw.edges?.length ? raw.edges : (raw.edges_data ?? []),
  };
}

export const workflowService = {
  getList: (params?: WorkflowListParams): Promise<WorkflowListResponse> =>
    http.get('/workflows', { params }),

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

  validate: (id: string): Promise<ValidateWorkflowResponse> =>
    http.post(`/workflows/${id}/validate`),

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

  import: (file: File): Promise<Workflow> => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post('/workflows/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getVersions: (id: string): Promise<WorkflowVersion[]> => http.get(`/workflows/${id}/versions`),

  getVersion: async (id: string, version: number): Promise<Workflow> =>
    normalizeWorkflow(await http.get(`/workflows/${id}/versions/${version}`)),

  rollbackVersion: async (id: string, version: number): Promise<Workflow> =>
    normalizeWorkflow(await http.post(`/workflows/${id}/versions/${version}/rollback`)),

  duplicate: async (id: string): Promise<Workflow> => {
    const source = await workflowService.getById(id);
    return workflowService.create({
      name: `${source.name} (副本)`,
      description: source.description,
    }).then(async (created) =>
      workflowService.update(created.id, {
        nodes: source.nodes,
        edges: source.edges,
      }),
    );
  },
};

export default workflowService;
