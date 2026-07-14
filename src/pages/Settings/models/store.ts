import { createListStore } from '@/stores/listStoreFactory';
import { modelService } from '@/services/modelService';
import { toListResponse } from '@/utils/listAdapter';
import type { CreateSupplierRequest, ModelSupplier, UpdateSupplierRequest } from '@/types';
import type { ListQueryParams } from '@/types/list';

async function listSuppliers(params: ListQueryParams) {
  const res = await modelService.getSuppliers();
  const keyword = (params.keyword || '').toLowerCase();
  let items = res.suppliers;
  if (keyword) {
    items = items.filter((s) => s.name.toLowerCase().includes(keyword));
  }
  const start = (params.page - 1) * params.pageSize;
  const pageItems = items.slice(start, start + params.pageSize);
  return toListResponse(pageItems, items.length, params);
}

export const useModelListStore = createListStore<
  ModelSupplier,
  CreateSupplierRequest,
  UpdateSupplierRequest
>({
  api: {
    list: listSuppliers,
    create: (input) => modelService.createSupplier(input),
    remove: (id) => modelService.deleteSupplier(id),
    update: (id, input) => modelService.updateSupplier(id, input),
  },
  defaultPageSize: 50,
  defaultSort: { sortBy: 'name', sortOrder: 'asc' },
  deleteStrategy: 'refetch',
  createStrategy: 'refetch',
  updateStrategy: 'optimistic',
});
