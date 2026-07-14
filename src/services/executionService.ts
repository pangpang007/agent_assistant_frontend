import http from '@/lib/axios';
import type {
  ExecutionDetail,
  ExecutionListParams,
  ExecutionListResponse,
  LogEntry,
  StartExecutionRequest,
  StartExecutionResponse,
  SubmitReviewRequest,
} from '@/types/execution';

export const executionService = {
  /** POST /workflows/:workflowId/run */
  startExecution: async (params: StartExecutionRequest): Promise<StartExecutionResponse> => {
    const res = (await http.post(`/workflows/${params.workflowId}/run`, {
      inputs: params.inputValues,
      inputValues: params.inputValues,
    })) as StartExecutionResponse & { executionId?: string; execution_id?: string };

    const executionId = res.executionId ?? res.execution_id ?? '';
    return {
      executionId,
      workflowId: res.workflowId ?? params.workflowId,
      status: res.status ?? 'pending',
      createdAt: res.createdAt ?? new Date().toISOString(),
    };
  },

  getExecution: (executionId: string): Promise<ExecutionDetail> =>
    http.get(`/executions/${executionId}`),

  getExecutions: async (params?: ExecutionListParams): Promise<ExecutionListResponse> => {
    const res = await http.get('/executions', {
      params: {
        workflow_id: params?.workflowId,
        status: params?.status,
        page: params?.page,
        page_size: params?.pageSize,
      },
    });
    if (Array.isArray(res)) {
      return { items: res as ExecutionDetail[], total: res.length, page: 1, pageSize: res.length };
    }
    const obj = res as unknown as ExecutionListResponse & { results?: ExecutionDetail[] };
    return {
      items: obj.items ?? obj.results ?? [],
      total: obj.total ?? 0,
      page: obj.page ?? 1,
      pageSize: obj.pageSize ?? params?.pageSize ?? 20,
    };
  },

  stopExecution: (executionId: string): Promise<void> =>
    http.post(`/executions/${executionId}/stop`),

  submitReview: (executionId: string, params: SubmitReviewRequest): Promise<void> =>
    http.post(`/executions/${executionId}/review`, params),

  getExecutionLogs: async (
    executionId: string,
  ): Promise<{ logs: Array<Omit<LogEntry, 'id'> & { id?: string }> }> => {
    const res = await http.get(`/executions/${executionId}/logs`);
    if (Array.isArray(res)) return { logs: res };
    return (res as unknown as { logs: Array<Omit<LogEntry, 'id'> & { id?: string }> }) ?? { logs: [] };
  },
};
