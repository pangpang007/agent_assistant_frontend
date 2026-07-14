import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';
import { useListPage } from '@/hooks/useListPage';
import { toolService } from '@/services/toolService';
import { handleApiError } from '@/utils/apiErrorHandler';
import type { Tool, ToolType } from '@/types';
import { useToolListStore } from './store';

type TypeFilter = 'all' | ToolType;

export function useToolListPage() {
  const navigate = useNavigate();
  const { success } = useToast();
  const listPage = useListPage(useToolListStore, { autoFetch: false });
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilterState] = useState<TypeFilter>('all');
  const [loadError, setLoadError] = useState(false);

  const safeFetch = useCallback(async () => {
    setLoadError(false);
    try {
      await listPage.fetch();
    } catch (error) {
      setLoadError(true);
      handleApiError(error, '加载工具列表');
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

  const handleDelete = async (id: string, agentCount: number) => {
    try {
      await listPage.remove(id);
      success(agentCount > 0 ? '工具已删除，相关 Agent 已更新' : '工具已删除');
    } catch (error) {
      handleApiError(error, '删除工具');
      throw error;
    }
  };

  const loadReferences = async (tool: Tool) => {
    const refs = await toolService.getReferences(tool.id);
    return {
      agentCount: refs.agent_count,
      agentNames: (refs.agents ?? []).map((a) => a.name),
    };
  };

  return {
    ...listPage,
    searchInput,
    typeFilter,
    loadError,
    navigate,
    safeFetch,
    handleSearchChange,
    setTypeFilter,
    handleDelete,
    loadReferences,
  };
}
