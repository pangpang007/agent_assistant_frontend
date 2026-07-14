import { create } from 'zustand';
import { templateService } from '@/services/templateService';
import type { GetTemplatesParams, Template, TemplateCategory } from '@/types/phase6';

interface TemplateState {
  templates: Template[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: {
    category: TemplateCategory | 'all';
    source: 'all' | 'official' | 'custom';
    keyword: string;
  };
  setFilter: (patch: Partial<TemplateState['filters']>) => void;
  fetchTemplates: () => Promise<void>;
  reset: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  total: 0,
  loading: false,
  error: null,
  filters: { category: 'all', source: 'all', keyword: '' },

  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),

  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const params: GetTemplatesParams = {
        keyword: filters.keyword || undefined,
        category: filters.category === 'all' ? undefined : filters.category,
        is_official:
          filters.source === 'all' ? undefined : filters.source === 'official',
        page: 1,
        page_size: 50,
      };
      const res = await templateService.getTemplates(params);
      set({ templates: res.data, total: res.total, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : '加载模板失败',
        templates: [],
      });
    }
  },

  reset: () =>
    set({
      templates: [],
      total: 0,
      loading: false,
      error: null,
      filters: { category: 'all', source: 'all', keyword: '' },
    }),
}));
