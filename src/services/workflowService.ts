import http from '@/lib/axios';
import type {
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
  CreateWorkflowRequest,
} from '@/types';

export const workflowService = {
  getList: (params?: WorkflowListParams): Promise<WorkflowListResponse> =>
    http.get('/workflows', { params }),

  getById: (id: string): Promise<Workflow> => http.get(`/workflows/${id}`),

  create: (data: CreateWorkflowRequest): Promise<Workflow> => http.post('/workflows', data),

  update: (id: string, data: UpdateWorkflowRequest): Promise<Workflow> =>
    http.put(`/workflows/${id}`, data),

  delete: (id: string): Promise<void> => http.delete(`/workflows/${id}`),

  save: (id: string, data: SaveWorkflowRequest): Promise<SaveWorkflowResponse> =>
    http.post(`/workflows/${id}/save`, data),

  validate: (id: string): Promise<ValidateWorkflowResponse> =>
    http.post(`/workflows/${id}/validate`),

  run: (id: string, data: RunWorkflowRequest): Promise<RunWorkflowResponse> =>
    http.post(`/workflows/${id}/run`, data),

  testNode: (id: string, data: TestNodeRequest): Promise<TestNodeResponse> =>
    http.post(`/workflows/${id}/test-node`, data),

  export: (id: string): Promise<Record<string, unknown>> => http.get(`/workflows/${id}/export`),

  import: (file: File): Promise<Workflow> => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post('/workflows/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getVersions: (id: string): Promise<WorkflowVersion[]> => http.get(`/workflows/${id}/versions`),

  getVersion: (id: string, version: number): Promise<Workflow> =>
    http.get(`/workflows/${id}/versions/${version}`),

  rollbackVersion: (id: string, version: number): Promise<Workflow> =>
    http.post(`/workflows/${id}/versions/${version}/rollback`),

  duplicate: (id: string): Promise<Workflow> => http.post(`/workflows/${id}/duplicate`),
};

export default workflowService;
