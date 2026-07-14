import http from '@/lib/axios';
import { pickList } from '@/lib/arrayUtils';
import type { PublishedApi, PublishResult } from '@/types/phase7';

function normalizeApi(raw: Record<string, unknown>): PublishedApi {
  return {
    id: String(raw.id ?? ''),
    workflowId: String(raw.workflowId ?? raw.workflow_id ?? ''),
    workflowName: String(raw.workflowName ?? raw.workflow_name ?? ''),
    endpoint: String(raw.endpoint ?? raw.url ?? ''),
    apiKeyMasked: String(raw.apiKeyMasked ?? raw.api_key_masked ?? '****'),
    callCount: Number(raw.callCount ?? raw.call_count ?? 0),
    successRate: Number(raw.successRate ?? raw.success_rate ?? 0),
    avgDurationMs: Number(raw.avgDurationMs ?? raw.avg_duration_ms ?? 0),
    enabled: Boolean(raw.enabled ?? raw.is_enabled ?? true),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
  };
}

export const apiService = {
  publish: async (workflowId: string): Promise<PublishResult> => {
    const res = (await http.post(`/workflows/${workflowId}/publish`)) as Record<string, unknown>;
    return {
      endpoint: String(res.endpoint ?? ''),
      apiKey: String(res.apiKey ?? res.api_key ?? ''),
      id: res.id ? String(res.id) : undefined,
    };
  },

  listPublished: async (): Promise<PublishedApi[]> => {
    const res = await http.get('/published-apis');
    return pickList<Record<string, unknown>>(res, ['items', 'data', 'results', 'apis']).map(
      normalizeApi,
    );
  },

  resetApiKey: async (apiId: string): Promise<{ apiKey: string }> => {
    const res = (await http.post(`/published-apis/${apiId}/reset-key`)) as Record<string, unknown>;
    return { apiKey: String(res.apiKey ?? res.api_key ?? '') };
  },

  toggleApi: (apiId: string, enabled: boolean): Promise<void> =>
    http.patch(`/published-apis/${apiId}`, { enabled }),

  deleteApi: (apiId: string): Promise<void> => http.delete(`/published-apis/${apiId}`),

  getByWorkflow: async (workflowId: string): Promise<PublishedApi | null> => {
    const list = await apiService.listPublished();
    return list.find((a) => a.workflowId === workflowId) ?? null;
  },
};
