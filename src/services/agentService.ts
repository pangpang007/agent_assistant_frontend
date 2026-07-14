import http from '@/lib/axios';
import { asArray, pickList } from '@/lib/arrayUtils';
import type {
  Agent,
  AgentListParams,
  AgentListResponse,
  CreateAgentRequest,
  UpdateAgentRequest,
} from '@/types';

export const agentService = {
  getList: async (params?: AgentListParams): Promise<AgentListResponse> => {
    const res = await http.get('/agents', { params });
    const agents = pickList<Agent>(res, ['agents', 'items', 'results']);
    const total =
      res && typeof res === 'object' && !Array.isArray(res)
        ? Number((res as { total?: number }).total ?? agents.length)
        : agents.length;
    return { agents, total };
  },

  getById: async (id: string): Promise<Agent> => {
    const agent = (await http.get(`/agents/${id}`)) as Agent;
    return {
      ...agent,
      tool_ids: asArray(agent?.tool_ids),
    };
  },

  create: (data: CreateAgentRequest): Promise<Agent> => http.post('/agents', data),

  update: (id: string, data: UpdateAgentRequest): Promise<Agent> =>
    http.put(`/agents/${id}`, data),

  delete: (id: string): Promise<void> => http.delete(`/agents/${id}`),

  duplicate: (id: string, name?: string): Promise<Agent> =>
    http.post(`/agents/${id}/copy`, { name: name ?? null }),
};
