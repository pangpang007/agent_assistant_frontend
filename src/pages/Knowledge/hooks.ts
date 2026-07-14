import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';
import { useListPage } from '@/hooks/useListPage';
import { getApiErrorStatus } from '@/lib/validation';
import { handleApiError } from '@/utils/apiErrorHandler';
import { useKnowledgeListStore } from './store';

export function useKnowledgeListPage() {
  const navigate = useNavigate();
  const { success } = useToast();
  const listPage = useListPage(useKnowledgeListStore, { autoFetch: false });
  const [searchInput, setSearchInput] = useState('');
  const [loadError, setLoadError] = useState(false);

  const safeFetch = useCallback(async () => {
    setLoadError(false);
    try {
      await listPage.fetch();
    } catch (error) {
      setLoadError(true);
      handleApiError(error, '加载知识库列表');
    }
  }, [listPage.fetch]);

  useEffect(() => {
    void safeFetch();
  }, [safeFetch]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    listPage.debouncedSearch(value);
  };

  const handleCreate = async (input: { name: string; description?: string }) => {
    try {
      const kb = await listPage.create(input);
      success('知识库创建成功');
      navigate(`/knowledge/${kb.id}`);
      return kb;
    } catch (error) {
      if (getApiErrorStatus(error) === 409) throw error;
      handleApiError(error, '创建知识库');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await listPage.remove(id);
      success('知识库已删除');
    } catch (error) {
      handleApiError(error, '删除知识库');
      throw error;
    }
  };

  return {
    ...listPage,
    searchInput,
    loadError,
    navigate,
    safeFetch,
    handleSearchChange,
    handleCreate,
    handleDelete,
  };
}
