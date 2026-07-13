import http from '@/lib/axios';
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

export const toolService = {
  getList: (params?: { type?: ToolType; search?: string }): Promise<ToolListResponse> =>
    http.get('/tools', { params }),

  getById: (id: string): Promise<Tool> => http.get(`/tools/${id}`),

  create: (data: CreateToolRequest): Promise<Tool> => http.post('/tools', data),

  update: (id: string, data: UpdateToolRequest): Promise<Tool> =>
    http.put(`/tools/${id}`, data),

  delete: (id: string): Promise<void> => http.delete(`/tools/${id}`),

  getReferences: (id: string): Promise<ToolReferenceResponse> =>
    http.get(`/tools/${id}/references`),

  testTool: (id: string, data: ToolTestRequest): Promise<ToolTestResponse> =>
    http.post(`/tools/${id}/test`, data),

  parseSwagger: (swaggerJson: string): Promise<SwaggerParseResult> =>
    http.post('/tools/parse-swagger', { swagger_json: swaggerJson }),
};
