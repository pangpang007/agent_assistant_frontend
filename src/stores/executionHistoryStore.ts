import { create } from 'zustand';
import { executionService } from '@/services/executionService';
import type {
  GetHistoryExecutionsParams,
  HistoryExecution,
  HistoryExecutionDetail,
} from '@/types/phase6';

interface ExecutionHistoryState {
  list: HistoryExecution[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  filters: {
    workflow_id?: string;
    status?: string;
    keyword?: string;
  };
  detail: HistoryExecutionDetail | null;
  detailLoading: boolean;
  setFilter: (patch: Partial<ExecutionHistoryState['filters']>) => void;
  setPage: (page: number) => void;
  fetchList: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  clearDetail: () => void;
}

export const useExecutionHistoryStore = create<ExecutionHistoryState>((set, get) => ({
  list: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  error: null,
  filters: {},
  detail: null,
  detailLoading: false,

  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch }, page: 1 })),
  setPage: (page) => set({ page }),
  clearDetail: () => set({ detail: null }),

  fetchList: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, page, pageSize } = get();
      const params: GetHistoryExecutionsParams = {
        ...filters,
        page,
        page_size: pageSize,
      };
      const res = await executionService.getHistoryList(params);
      set({ list: res.data, total: res.total, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : '加载执行历史失败',
        list: [],
      });
    }
  },

  fetchDetail: async (id) => {
    set({ detailLoading: true });
    try {
      const detail = await executionService.getHistoryDetail(id);
      set({ detail, detailLoading: false });
    } catch {
      set({ detail: null, detailLoading: false });
    }
  },
}));
