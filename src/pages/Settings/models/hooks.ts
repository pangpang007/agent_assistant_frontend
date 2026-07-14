import { useListPage } from '@/hooks/useListPage';
import { modelService } from '@/services/modelService';
import { handleApiError } from '@/utils/apiErrorHandler';
import type { SupplierStatus } from '@/types';
import { useModelListStore } from './store';

export function useModelListPage() {
  const listPage = useListPage(useModelListStore);

  const toggleEnabled = async (id: string, currentStatus: SupplierStatus) => {
    const next: SupplierStatus = currentStatus === 'active' ? 'disabled' : 'active';
    useModelListStore.getState().updateItem(id, { status: next });
    try {
      await modelService.toggleSupplierStatus(id, next);
    } catch (error) {
      useModelListStore.getState().updateItem(id, { status: currentStatus });
      handleApiError(error, '切换供应商状态');
      throw error;
    }
  };

  return { ...listPage, toggleEnabled };
}
