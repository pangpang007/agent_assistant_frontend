import http from '@/lib/axios';
import { pickList } from '@/lib/arrayUtils';
import type {
  ExecutionDetail,
  ExecutionListParams,
  ExecutionListResponse,
  LogEntry,
  StartExecutionRequest,
  StartExecutionResponse,
  SubmitReviewRequest,
} from '@/types/execution';
import type {
  GetHistoryExecutionsParams,
  HistoryExecution,
  HistoryExecutionDetail,
  PaginatedResponse,
} from '@/types/phase6';

function normalizeHistoryPage(
  res: unknown,
  page = 1,
  pageSize = 20,
): PaginatedResponse<HistoryExecution> {
  if (Array.isArray(res)) {
    return {
      data: res as HistoryExecution[],
      total: res.length,
      page,
      page_size: pageSize,
      has_more: false,
    };
  }
  const obj = (res ?? {}) as Record<string, unknown>;
  const data = pickList<HistoryExecution>(res, ['data', 'items', 'results', 'executions']);
  const total = Number(obj.total ?? data.length);
  const currentPage = Number(obj.page ?? page);
  const size = Number(obj.page_size ?? obj.pageSize ?? pageSize);
  return {
    data,
    total,
    page: currentPage,
    page_size: size,
    has_more: Boolean(obj.has_more ?? currentPage * size < total),
  };
}

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

  /** Phase 6 — execution history list */
  getHistoryList: async (
    params?: GetHistoryExecutionsParams,
  ): Promise<PaginatedResponse<HistoryExecution>> => {
    const res = await http.get('/executions', { params });
    return normalizeHistoryPage(res, params?.page, params?.page_size);
  },

  /** Phase 6 — execution history detail (nodes + logs + optional snapshot) */
  getHistoryDetail: async (id: string): Promise<HistoryExecutionDetail> => {
    const res = (await http.get(`/executions/${id}`)) as HistoryExecutionDetail;
    return {
      ...res,
      nodes: pickList(res, ['nodes', 'node_results']) as HistoryExecutionDetail['nodes'],
      logs: pickList(res, ['logs']) as HistoryExecutionDetail['logs'],
    };
  },
};
