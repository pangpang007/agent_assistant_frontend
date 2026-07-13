import http from '@/lib/axios';
import type {
  Agent,
  AgentListParams,
  AgentListResponse,
  CreateAgentRequest,
  UpdateAgentRequest,
} from '@/types';

export const agentService = {
  getList: (params?: AgentListParams): Promise<AgentListResponse> =>
    http.get('/agents', { params }),

  getById: (id: string): Promise<Agent> => http.get(`/agents/${id}`),

  create: (data: CreateAgentRequest): Promise<Agent> => http.post('/agents', data),

  update: (id: string, data: UpdateAgentRequest): Promise<Agent> =>
    http.put(`/agents/${id}`, data),

  delete: (id: string): Promise<void> => http.delete(`/agents/${id}`),

  duplicate: (id: string, name?: string): Promise<Agent> =>
    http.post(`/agents/${id}/copy`, { name: name ?? null }),
};
