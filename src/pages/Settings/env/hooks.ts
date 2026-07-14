import { useListPage } from '@/hooks/useListPage';
import { useEnvListStore } from './store';

export function useEnvListPage() {
  return useListPage(useEnvListStore);
}
