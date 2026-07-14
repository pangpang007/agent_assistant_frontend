/** Shared list-page state types (supplement list-page spec). */

export interface ListQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface ListApiResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListState<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  keyword: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, unknown>;
  loading: boolean;
  loadingMore: boolean;
  selectedIds: Set<string>;
  selectedItems: T[];
}

export interface ListActions<T, CreateInput = unknown, UpdateInput = unknown> {
  fetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setKeyword: (keyword: string) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setFilters: (filters: Record<string, unknown>) => void;
  resetFilters: () => void;
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  create: (input: CreateInput) => Promise<T>;
  remove: (id: string) => Promise<void>;
  removeBatch: (ids: string[]) => Promise<void>;
  update: (id: string, input: UpdateInput) => Promise<T>;
  updateItem: (id: string, patch: Partial<T>) => void;
  removeItem: (id: string) => void;
  prependItem: (item: T) => void;
}

export interface ListConfig<T, CreateInput = unknown, UpdateInput = unknown> {
  api: {
    list: (params: ListQueryParams) => Promise<ListApiResponse<T>>;
    create: (input: CreateInput) => Promise<T>;
    remove: (id: string) => Promise<void>;
    removeBatch?: (ids: string[]) => Promise<void>;
    update: (id: string, input: UpdateInput) => Promise<T>;
  };
  defaultPageSize?: number;
  defaultSort?: { sortBy: string; sortOrder: 'asc' | 'desc' };
  deleteStrategy: 'optimistic' | 'refetch';
  createStrategy: 'optimistic' | 'refetch';
  updateStrategy: 'optimistic' | 'refetch';
  createInsertPosition?: 'prepend' | 'refetch';
}

export type ListStore<T, C = unknown, U = unknown> = ListState<T> & ListActions<T, C, U>;
