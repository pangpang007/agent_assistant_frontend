import { createListStore } from '@/stores/listStoreFactory';
import { envService } from '@/services/envService';
import { toListResponse } from '@/utils/listAdapter';
import type { EnvVarFormValues, EnvVariable } from '@/types/phase6';
import type { ListQueryParams } from '@/types/list';

async function listEnvVars(params: ListQueryParams) {
  const all = await envService.getEnvVars();
  const keyword = (params.keyword || '').toLowerCase();
  const filtered = keyword
    ? all.filter((item) => item.key.toLowerCase().includes(keyword))
    : all;

  const sortBy = params.sortBy || 'key';
  const order = params.sortOrder === 'desc' ? -1 : 1;
  filtered.sort((a, b) => {
    const key = sortBy as keyof EnvVariable;
    const av = String(a[key] ?? a.key);
    const bv = String(b[key] ?? b.key);
    return av.localeCompare(bv) * order;
  });

  const start = (params.page - 1) * params.pageSize;
  const items = filtered.slice(start, start + params.pageSize);
  return toListResponse(items, filtered.length, params);
}

export const useEnvListStore = createListStore<EnvVariable, EnvVarFormValues, Partial<EnvVarFormValues>>({
  api: {
    list: listEnvVars,
    create: (input) => envService.createEnvVar(input),
    remove: (id) => envService.deleteEnvVar(id),
    update: (id, input) => envService.updateEnvVar(id, input),
  },
  defaultPageSize: 50,
  defaultSort: { sortBy: 'key', sortOrder: 'asc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'optimistic',
  createInsertPosition: 'prepend',
  updateStrategy: 'optimistic',
});
