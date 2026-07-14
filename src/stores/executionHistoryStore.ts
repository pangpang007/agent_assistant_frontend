import { create } from 'zustand';
import { executionService } from '@/services/executionService';
import type { HistoryExecutionDetail } from '@/types/phase6';

/** Detail-only store for execution detail page (list lives in pages/Executions/store). */
interface ExecutionDetailState {
  detail: HistoryExecutionDetail | null;
  detailLoading: boolean;
  fetchDetail: (id: string) => Promise<void>;
  clearDetail: () => void;
}

export const useExecutionHistoryStore = create<ExecutionDetailState>((set) => ({
  detail: null,
  detailLoading: false,
  clearDetail: () => set({ detail: null }),
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
