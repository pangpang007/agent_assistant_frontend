import { create } from 'zustand';
import { executionService } from '@/services/executionService';
import type { HistoryExecution } from '@/types/phase6';

/**
 * Execution history list — no create/delete; cancel + refetch; poll while running.
 */
interface ExecutionListState {
  items: HistoryExecution[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  keyword: string;
  statusFilter: string | null;
  fetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setKeyword: (keyword: string) => void;
  setStatusFilter: (status: string | null) => void;
  cancelExecution: (id: string) => Promise<void>;
}

export const useExecutionListStore = create<ExecutionListState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  keyword: '',
  statusFilter: null,

  fetch: async () => {
    const { page, pageSize, keyword, statusFilter } = get();
    set({ loading: true });
    try {
      const res = await executionService.getHistoryList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        status: statusFilter ?? undefined,
      });
      set({ items: res.data, total: res.total, loading: false });
    } catch {
      set({ loading: false, items: [], total: 0 });
      throw new Error('加载执行历史失败');
    }
  },

  setPage: (page) => {
    set({ page });
    void get().fetch();
  },
  setPageSize: (pageSize) => {
    set({ pageSize, page: 1 });
    void get().fetch();
  },
  setKeyword: (keyword) => {
    set({ keyword, page: 1 });
    void get().fetch();
  },
  setStatusFilter: (statusFilter) => {
    set({ statusFilter, page: 1 });
    void get().fetch();
  },

  cancelExecution: async (id: string) => {
    await executionService.stopExecution(id);
    await get().fetch();
  },
}));
