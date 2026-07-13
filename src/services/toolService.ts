import http from '@/lib/axios';
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
  getList: (params?: { type?: ToolType; search?: string }): Promise<ToolListResponse> =>
    http.get('/tools', { params }),

  getById: (id: string): Promise<Tool> => http.get(`/tools/${id}`),

  create: async (data: CreateToolRequest): Promise<Tool> =>
    http.post('/tools', await withEncryptedAuth(data)),

  update: async (id: string, data: UpdateToolRequest): Promise<Tool> =>
    http.put(`/tools/${id}`, await withEncryptedAuth(data)),

  delete: (id: string): Promise<void> => http.delete(`/tools/${id}`),

  getReferences: (id: string): Promise<ToolReferenceResponse> =>
    http.get(`/tools/${id}/references`),

  testTool: (id: string, data: ToolTestRequest): Promise<ToolTestResponse> =>
    http.post(`/tools/${id}/test`, data),

  parseSwagger: (swaggerJson: string): Promise<SwaggerParseResult> =>
    http.post('/tools/parse-swagger', { swagger_json: swaggerJson }),
};
