import http from '@/lib/axios';
import { pickList } from '@/lib/arrayUtils';
import type {
  CenterLogEntry,
  CenterLogFilter,
  PaginatedResponse,
} from '@/types/phase6';

function normalizePage(
  res: unknown,
  page = 1,
  pageSize = 50,
): PaginatedResponse<CenterLogEntry> {
  if (Array.isArray(res)) {
    return {
      data: res as CenterLogEntry[],
      total: res.length,
      page,
      page_size: pageSize,
      has_more: false,
    };
  }
  const obj = (res ?? {}) as Record<string, unknown>;
  const data = pickList<CenterLogEntry>(res, ['data', 'items', 'results', 'logs']);
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

export const logService = {
  getLogs: async (
    filter?: CenterLogFilter,
  ): Promise<PaginatedResponse<CenterLogEntry>> => {
    const res = await http.get('/logs', { params: filter });
    return normalizePage(res, filter?.page, filter?.page_size);
  },

  getLog: (id: string): Promise<CenterLogEntry> => http.get(`/logs/${id}`),
};
