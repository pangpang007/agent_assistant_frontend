import { create } from 'zustand';
import { logService } from '@/services/logService';
import type { CenterLogEntry, CenterLogLevel } from '@/types/phase6';

interface LogListState {
  items: CenterLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  levelFilter: CenterLogLevel | null;
  keyword: string;
  selected: CenterLogEntry | null;
  fetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setKeyword: (keyword: string) => void;
  setLevelFilter: (level: CenterLogLevel | null) => void;
  selectLog: (log: CenterLogEntry | null) => void;
}

export const useLogListStore = create<LogListState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 50,
  loading: false,
  levelFilter: null,
  keyword: '',
  selected: null,

  fetch: async () => {
    const { page, pageSize, keyword, levelFilter } = get();
    set({ loading: true });
    try {
      const res = await logService.getLogs({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        level: levelFilter ?? undefined,
      });
      set({ items: res.data, total: res.total, loading: false });
    } catch {
      set({ loading: false, items: [], total: 0 });
      throw new Error('加载日志失败');
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
  setLevelFilter: (levelFilter) => {
    set({ levelFilter, page: 1 });
    void get().fetch();
  },
  selectLog: (log) => set({ selected: log }),
}));
