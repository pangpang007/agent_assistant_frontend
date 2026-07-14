import http from '@/lib/axios';
import { pickList } from '@/lib/arrayUtils';
import type { DashboardStats, TokenTrendItem } from '@/types/phase7';
import type { HistoryExecution } from '@/types/phase6';
import type { WorkflowListItem } from '@/types';

function normalizeStats(raw: unknown): DashboardStats {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    workflowCount: Number(obj.workflowCount ?? obj.workflow_count ?? 0),
    agentCount: Number(obj.agentCount ?? obj.agent_count ?? 0),
    knowledgeBaseCount: Number(obj.knowledgeBaseCount ?? obj.knowledge_base_count ?? 0),
    monthlyExecutions: Number(obj.monthlyExecutions ?? obj.monthly_executions ?? 0),
    successRate: Number(obj.successRate ?? obj.success_rate ?? 0),
  };
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      return normalizeStats(await http.get('/dashboard/stats'));
    } catch {
      // Fallback: aggregate from existing list APIs when dashboard endpoint missing
      const [workflows, agents, knowledge] = await Promise.allSettled([
        http.get('/workflows', { params: { page: 1, page_size: 1 } }),
        http.get('/agents', { params: { page: 1, page_size: 1 } }),
        http.get('/knowledge', { params: { page: 1, page_size: 1 } }),
      ]);
      const totalOf = (r: PromiseSettledResult<unknown>, keys: string[]) => {
        if (r.status !== 'fulfilled') return 0;
        const v = r.value as Record<string, unknown>;
        if (Array.isArray(v)) return v.length;
        for (const k of keys) {
          if (typeof v?.[k] === 'number') return v[k] as number;
        }
        return pickList(v, ['items', 'workflows', 'agents', 'knowledge_bases']).length;
      };
      return {
        workflowCount: totalOf(workflows, ['total']),
        agentCount: totalOf(agents, ['total']),
        knowledgeBaseCount: totalOf(knowledge, ['total']),
        monthlyExecutions: 0,
        successRate: 0,
      };
    }
  },

  getTokenTrend: async (params: { days: number }): Promise<TokenTrendItem[]> => {
    try {
      const res = await http.get('/dashboard/token-trend', { params });
      return pickList<TokenTrendItem>(res, ['items', 'data', 'results', 'trend']);
    } catch {
      return [];
    }
  },

  getRecentWorkflows: async (limit = 5): Promise<WorkflowListItem[]> => {
    const res = await http.get('/workflows', {
      params: { sort_by: 'updated_at', sort_order: 'desc', page_size: limit },
    });
    return pickList<WorkflowListItem>(res, ['workflows', 'items', 'results']);
  },

  getRecentExecutions: async (limit = 5): Promise<HistoryExecution[]> => {
    const res = await http.get('/executions', {
      params: { page_size: limit, sort: 'started_at', order: 'desc' },
    });
    return pickList<HistoryExecution>(res, ['data', 'items', 'results', 'executions']);
  },
};
