import { create } from 'zustand';
import { envService } from '@/services/envService';
import type { EnvVarFormValues, EnvVariable } from '@/types/phase6';

interface EnvVarState {
  items: EnvVariable[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  create: (values: EnvVarFormValues) => Promise<void>;
  update: (id: string, values: Partial<EnvVarFormValues>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useEnvVarStore = create<EnvVarState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const items = await envService.getEnvVars();
      set({ items, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : '加载环境变量失败',
        items: [],
      });
    }
  },

  create: async (values) => {
    await envService.createEnvVar(values);
    await get().fetch();
  },

  update: async (id, values) => {
    await envService.updateEnvVar(id, values);
    await get().fetch();
  },

  remove: async (id) => {
    await envService.deleteEnvVar(id);
    await get().fetch();
  },
}));
