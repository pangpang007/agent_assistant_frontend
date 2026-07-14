import type { ListApiResponse, ListQueryParams } from '@/types/list';

/** Normalize heterogeneous list payloads into the standard list envelope. */
export function toListResponse<T>(
  items: T[],
  total: number,
  params: Pick<ListQueryParams, 'page' | 'pageSize'>,
): ListApiResponse<T> {
  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
}

/** Map camelCase list query to common backend snake_case params. */
export function toBackendListParams(params: ListQueryParams): Record<string, unknown> {
  const { page, pageSize, keyword, sortBy, sortOrder, ...rest } = params;
  return {
    page,
    page_size: pageSize,
    ...(keyword ? { search: keyword, keyword } : {}),
    ...(sortBy
      ? {
          sort_by: sortBy.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`),
          sort_order: sortOrder,
        }
      : {}),
    ...rest,
  };
}
