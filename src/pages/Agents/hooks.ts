import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';
import { useListPage } from '@/hooks/useListPage';
import { agentService } from '@/services/agentService';
import { handleApiError } from '@/utils/apiErrorHandler';
import type { AgentType } from '@/types';
import { useAgentListStore } from './store';

type TypeFilter = 'all' | AgentType;

export function useAgentListPage() {
  const navigate = useNavigate();
  const { success } = useToast();
  const listPage = useListPage(useAgentListStore, { autoFetch: false });
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilterState] = useState<TypeFilter>('all');
  const [loadError, setLoadError] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  const safeFetch = useCallback(async () => {
    setLoadError(false);
    try {
      await listPage.fetch();
    } catch (error) {
      setLoadError(true);
      handleApiError(error, '加载 Agent 列表');
    }
  }, [listPage.fetch]);

  useEffect(() => {
    void safeFetch();
  }, [safeFetch]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    listPage.debouncedSearch(value);
  };

  const setTypeFilter = (type: TypeFilter) => {
    setTypeFilterState(type);
    listPage.setFilters(type === 'all' ? {} : { type });
  };

  const setSortKey = (key: string) => {
    if (key === 'name_asc') listPage.setSort('name', 'asc');
    else if (key === 'name_desc') listPage.setSort('name', 'desc');
    else if (key === 'created_at_asc') listPage.setSort('created_at', 'asc');
    else listPage.setSort('created_at', 'desc');
  };

  const sortKey =
    listPage.sortBy === 'name'
      ? listPage.sortOrder === 'asc'
        ? 'name_asc'
        : 'name_desc'
      : listPage.sortOrder === 'asc'
        ? 'created_at_asc'
        : 'created_at_desc';

  const handleDuplicate = async (id: string) => {
    setIsDuplicating(id);
    try {
      await agentService.duplicate(id);
      success('已复制为自定义 Agent');
      await listPage.fetch();
    } catch (error) {
      handleApiError(error, '复制 Agent');
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await listPage.remove(id);
      success('Agent 已删除');
    } catch (error) {
      handleApiError(error, '删除 Agent');
      throw error;
    }
  };

  return {
    ...listPage,
    searchInput,
    typeFilter,
    sortKey,
    loadError,
    isDuplicating,
    safeFetch,
    handleSearchChange,
    setTypeFilter,
    setSortKey,
    handleDuplicate,
    handleDelete,
    navigate,
  };
}
