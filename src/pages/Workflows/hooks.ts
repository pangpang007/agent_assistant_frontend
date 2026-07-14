import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';
import { useListPage } from '@/hooks/useListPage';
import { workflowService } from '@/services/workflowService';
import { handleApiError } from '@/utils/apiErrorHandler';
import { useWorkflowListStore } from './store';

export function useWorkflowListPage() {
  const navigate = useNavigate();
  const { success } = useToast();
  const listPage = useListPage(useWorkflowListStore, { autoFetch: false });
  const [searchInput, setSearchInput] = useState(listPage.keyword);
  const [loadError, setLoadError] = useState(false);

  const safeFetch = useCallback(async () => {
    setLoadError(false);
    try {
      await listPage.fetch();
    } catch (error) {
      setLoadError(true);
      handleApiError(error, '加载工作流列表');
    }
  }, [listPage.fetch]);

  useEffect(() => {
    void safeFetch();
  }, [safeFetch]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    listPage.debouncedSearch(value);
  };

  const handleCreate = async () => {
    try {
      const item = await listPage.create({ name: '未命名工作流' });
      success('创建成功');
      navigate(`/workflows/${item.id}`);
    } catch (error) {
      handleApiError(error, '创建工作流');
    }
  };

  const handleRename = async (id: string, name: string) => {
    try {
      await listPage.update(id, { name });
      success('重命名成功');
    } catch (error) {
      handleApiError(error, '重命名');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const workflow = await workflowService.duplicate(id);
      success('复制成功');
      await listPage.fetch();
      navigate(`/workflows/${workflow.id}`);
    } catch (error) {
      handleApiError(error, '复制工作流');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await listPage.remove(id);
      success('删除成功');
    } catch (error) {
      handleApiError(error, '删除工作流');
      throw error;
    }
  };

  return {
    ...listPage,
    searchInput,
    loadError,
    safeFetch,
    handleSearchChange,
    handleCreate,
    handleRename,
    handleDuplicate,
    handleDelete,
  };
}
