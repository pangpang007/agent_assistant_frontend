import { useCallback, useEffect, useRef } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { ListStore } from '@/types/list';

export interface UseListPageOptions {
  autoFetch?: boolean;
  searchDebounceMs?: number;
  deps?: unknown[];
}

/**
 * Shared list-page hook: auto-fetch on mount, debounced search, empty/hasMore helpers.
 */
export function useListPage<T extends { id: string }, C = unknown, U = unknown>(
  useStore: UseBoundStore<StoreApi<ListStore<T, C, U>>>,
  options?: UseListPageOptions,
) {
  const { autoFetch = true, searchDebounceMs = 300, deps = [] } = options ?? {};

  const items = useStore((s) => s.items);
  const total = useStore((s) => s.total);
  const page = useStore((s) => s.page);
  const pageSize = useStore((s) => s.pageSize);
  const keyword = useStore((s) => s.keyword);
  const sortBy = useStore((s) => s.sortBy);
  const sortOrder = useStore((s) => s.sortOrder);
  const filters = useStore((s) => s.filters);
  const loading = useStore((s) => s.loading);
  const loadingMore = useStore((s) => s.loadingMore);
  const selectedIds = useStore((s) => s.selectedIds);
  const selectedItems = useStore((s) => s.selectedItems);

  const fetch = useStore((s) => s.fetch);
  const fetchMore = useStore((s) => s.fetchMore);
  const setPage = useStore((s) => s.setPage);
  const setPageSize = useStore((s) => s.setPageSize);
  const setKeyword = useStore((s) => s.setKeyword);
  const setSort = useStore((s) => s.setSort);
  const setFilters = useStore((s) => s.setFilters);
  const resetFilters = useStore((s) => s.resetFilters);
  const selectItem = useStore((s) => s.selectItem);
  const deselectItem = useStore((s) => s.deselectItem);
  const selectAll = useStore((s) => s.selectAll);
  const clearSelection = useStore((s) => s.clearSelection);
  const create = useStore((s) => s.create);
  const remove = useStore((s) => s.remove);
  const removeBatch = useStore((s) => s.removeBatch);
  const update = useStore((s) => s.update);
  const updateItem = useStore((s) => s.updateItem);
  const removeItem = useStore((s) => s.removeItem);
  const prependItem = useStore((s) => s.prependItem);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setKeywordRef = useRef(setKeyword);
  setKeywordRef.current = setKeyword;

  useEffect(() => {
    if (!autoFetch) return;
    void fetch().catch(() => {
      /* page layer handles toast */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + external deps only
  }, [autoFetch, ...deps]);

  const debouncedSearch = useCallback(
    (nextKeyword: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setKeywordRef.current(nextKeyword);
      }, searchDebounceMs);
    },
    [searchDebounceMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    items,
    total,
    page,
    pageSize,
    keyword,
    sortBy,
    sortOrder,
    filters,
    loading,
    loadingMore,
    selectedIds,
    selectedItems,
    fetch,
    fetchMore,
    setPage,
    setPageSize,
    setKeyword,
    setSort,
    setFilters,
    resetFilters,
    selectItem,
    deselectItem,
    selectAll,
    clearSelection,
    create,
    remove,
    removeBatch,
    update,
    updateItem,
    removeItem,
    prependItem,
    debouncedSearch,
    isEmpty: !loading && items.length === 0,
    hasMore: items.length < total,
  };
}
