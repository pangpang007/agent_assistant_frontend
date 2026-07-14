import http from '@/lib/axios';
import { asArray, pickList } from '@/lib/arrayUtils';
import { encryptOptional } from '@/lib/transportCrypto';
import type {
  CreateToolRequest,
  SwaggerParseResult,
  Tool,
  ToolListResponse,
  ToolReferenceResponse,
  ToolTestRequest,
  ToolTestResponse,
  ToolType,
  UpdateToolRequest,
} from '@/types';

async function encryptAuthConfig(
  authConfig: CreateToolRequest['auth_config'],
): Promise<CreateToolRequest['auth_config']> {
  if (!authConfig) return authConfig;

  const [token, apiKeyValue] = await Promise.all([
    encryptOptional(authConfig.token),
    encryptOptional(authConfig.api_key_value),
  ]);

  return {
    ...authConfig,
    ...(token !== undefined ? { token } : {}),
    ...(apiKeyValue !== undefined ? { api_key_value: apiKeyValue } : {}),
  };
}

async function withEncryptedAuth<T extends { auth_config?: CreateToolRequest['auth_config'] }>(
  data: T,
): Promise<T> {
  if (!data.auth_config) return data;
  return {
    ...data,
    auth_config: await encryptAuthConfig(data.auth_config),
  };
}

export const toolService = {
  getList: async (params?: {
    type?: ToolType;
    search?: string;
  }): Promise<ToolListResponse> => {
    const res = await http.get('/tools', { params });
    const tools = pickList<Tool>(res, ['tools', 'items', 'results']);
    const total =
      res && typeof res === 'object' && !Array.isArray(res)
        ? Number((res as { total?: number }).total ?? tools.length)
        : tools.length;
    return { tools, total };
  },

  getById: async (id: string): Promise<Tool> => {
    const tool = (await http.get(`/tools/${id}`)) as Tool;
    return { ...tool, parameters: asArray(tool?.parameters) };
  },

  create: async (data: CreateToolRequest): Promise<Tool> =>
    http.post('/tools', await withEncryptedAuth(data)),

  update: async (id: string, data: UpdateToolRequest): Promise<Tool> =>
    http.put(`/tools/${id}`, await withEncryptedAuth(data)),

  delete: (id: string): Promise<void> => http.delete(`/tools/${id}`),

  getReferences: async (id: string): Promise<ToolReferenceResponse> => {
    const res = await http.get(`/tools/${id}/references`);
    const agents = pickList<ToolReferenceResponse['agents'][number]>(res, [
      'agents',
      'items',
      'results',
    ]);
    const agentCount =
      res && typeof res === 'object' && !Array.isArray(res)
        ? Number((res as { agent_count?: number }).agent_count ?? agents.length)
        : agents.length;
    return { agents, agent_count: agentCount };
  },

  testTool: (id: string, data: ToolTestRequest): Promise<ToolTestResponse> =>
    http.post(`/tools/${id}/test`, data),

  parseSwagger: (swaggerJson: string): Promise<SwaggerParseResult> =>
    http.post('/tools/parse-swagger', { swagger_json: swaggerJson }),
};
