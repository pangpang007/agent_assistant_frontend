import { create } from 'zustand';
import { logService } from '@/services/logService';
import type { CenterLogEntry, CenterLogFilter, CenterLogLevel } from '@/types/phase6';

interface LogState {
  logs: CenterLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  filters: {
    level?: CenterLogLevel;
    keyword?: string;
    workflow_id?: string;
    execution_id?: string;
  };
  selected: CenterLogEntry | null;
  setFilter: (patch: Partial<LogState['filters']>) => void;
  setPage: (page: number) => void;
  selectLog: (log: CenterLogEntry | null) => void;
  fetchLogs: () => Promise<void>;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  total: 0,
  page: 1,
  pageSize: 50,
  loading: false,
  error: null,
  filters: {},
  selected: null,

  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch }, page: 1 })),
  setPage: (page) => set({ page }),
  selectLog: (log) => set({ selected: log }),

  fetchLogs: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, page, pageSize } = get();
      const params: CenterLogFilter = { ...filters, page, page_size: pageSize };
      const res = await logService.getLogs(params);
      set({ logs: res.data, total: res.total, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : '加载日志失败',
        logs: [],
      });
    }
  },
}));
