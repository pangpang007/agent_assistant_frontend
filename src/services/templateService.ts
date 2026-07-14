import http from '@/lib/axios';
import { asArray, pickList } from '@/lib/arrayUtils';
import type {
  GetTemplatesParams,
  PaginatedResponse,
  SaveAsTemplateRequest,
  Template,
} from '@/types/phase6';

function normalizePage<T>(res: unknown, page = 1, pageSize = 20): PaginatedResponse<T> {
  if (Array.isArray(res)) {
    return {
      data: res as T[],
      total: res.length,
      page,
      page_size: pageSize,
      has_more: false,
    };
  }
  const obj = (res ?? {}) as Record<string, unknown>;
  const data = pickList<T>(res, ['data', 'items', 'results', 'templates']);
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

export const templateService = {
  getTemplates: async (params?: GetTemplatesParams): Promise<PaginatedResponse<Template>> => {
    const res = await http.get('/templates', { params });
    return normalizePage<Template>(res, params?.page, params?.page_size);
  },

  getTemplate: (id: string): Promise<Template> => http.get(`/templates/${id}`),

  saveAsTemplate: async (request: SaveAsTemplateRequest): Promise<Template> =>
    http.post(`/workflows/${request.workflow_id}/save-as-template`, {
      name: request.name,
      description: request.description,
      category: request.category,
      tags: request.tags,
    }),

  useTemplate: async (
    templateId: string,
    workflowName: string,
  ): Promise<{ workflow_id: string }> => {
    const res = (await http.post(`/templates/${templateId}/use`, {
      workflow_name: workflowName,
    })) as { workflow_id?: string; id?: string };
    return { workflow_id: res.workflow_id ?? res.id ?? '' };
  },

  deleteTemplate: (id: string): Promise<void> => http.delete(`/templates/${id}`),
};

export function emptyTemplatesPage(): PaginatedResponse<Template> {
  return { data: asArray([]), total: 0, page: 1, page_size: 20, has_more: false };
}
