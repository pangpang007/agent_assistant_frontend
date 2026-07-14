import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { ListActions, ListConfig, ListState, ListStore } from '@/types/list';

/**
 * Factory for paginated list Zustand stores.
 * Each list page calls this at module top-level with its API + refresh strategies.
 */
export function createListStore<T extends { id: string }, C = unknown, U = unknown>(
  config: ListConfig<T, C, U>,
): UseBoundStore<StoreApi<ListStore<T, C, U>>> {
  const defaultPageSize = config.defaultPageSize ?? 20;
  const defaultSortBy = config.defaultSort?.sortBy ?? 'createdAt';
  const defaultSortOrder = config.defaultSort?.sortOrder ?? 'desc';

  return create<ListStore<T, C, U>>((set, get) => {
    const clearSelectionSilent = () => {
      set({ selectedIds: new Set(), selectedItems: [] });
    };

    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: defaultPageSize,
      keyword: '',
      sortBy: defaultSortBy,
      sortOrder: defaultSortOrder,
      filters: {},
      loading: false,
      loadingMore: false,
      selectedIds: new Set(),
      selectedItems: [],

      fetch: async () => {
        const { page, pageSize, keyword, sortBy, sortOrder, filters } = get();
        set({ loading: true });
        try {
          const res = await config.api.list({
            page,
            pageSize,
            keyword: keyword || undefined,
            sortBy,
            sortOrder,
            ...filters,
          });
          set({
            items: res.items,
            total: res.total,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      fetchMore: async () => {
        const { page, pageSize, items, keyword, sortBy, sortOrder, filters, total } = get();
        if (items.length >= total) return;

        const nextPage = page + 1;
        set({ loadingMore: true });
        try {
          const res = await config.api.list({
            page: nextPage,
            pageSize,
            keyword: keyword || undefined,
            sortBy,
            sortOrder,
            ...filters,
          });
          set({
            items: [...items, ...res.items],
            total: res.total,
            page: nextPage,
            loadingMore: false,
          });
        } catch (error) {
          set({ loadingMore: false });
          throw error;
        }
      },

      setPage: (page: number) => {
        set({ page });
        clearSelectionSilent();
        void get().fetch();
      },

      setPageSize: (pageSize: number) => {
        set({ pageSize, page: 1 });
        clearSelectionSilent();
        void get().fetch();
      },

      setKeyword: (keyword: string) => {
        set({ keyword, page: 1 });
        clearSelectionSilent();
        void get().fetch();
      },

      setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => {
        set({ sortBy, sortOrder, page: 1 });
        clearSelectionSilent();
        void get().fetch();
      },

      setFilters: (filters: Record<string, unknown>) => {
        set({ filters, page: 1 });
        clearSelectionSilent();
        void get().fetch();
      },

      resetFilters: () => {
        set({
          filters: {},
          keyword: '',
          sortBy: defaultSortBy,
          sortOrder: defaultSortOrder,
          page: 1,
        });
        clearSelectionSilent();
        void get().fetch();
      },

      selectItem: (id: string) => {
        const { selectedIds, items } = get();
        const next = new Set(selectedIds);
        next.add(id);
        set({
          selectedIds: next,
          selectedItems: items.filter((i) => next.has(i.id)),
        });
      },

      deselectItem: (id: string) => {
        const { selectedIds, items } = get();
        const next = new Set(selectedIds);
        next.delete(id);
        set({
          selectedIds: next,
          selectedItems: items.filter((i) => next.has(i.id)),
        });
      },

      selectAll: () => {
        const { items } = get();
        const ids = new Set(items.map((i) => i.id));
        set({ selectedIds: ids, selectedItems: [...items] });
      },

      clearSelection: () => {
        clearSelectionSilent();
      },

      create: async (input: C) => {
        const newItem = await config.api.create(input);

        if (config.createStrategy === 'optimistic' && config.createInsertPosition === 'prepend') {
          const { page, items, total } = get();
          if (page === 1) {
            set({
              items: [newItem, ...items],
              total: total + 1,
            });
          } else {
            await get().fetch();
          }
        } else {
          await get().fetch();
        }

        return newItem;
      },

      remove: async (id: string) => {
        if (config.deleteStrategy === 'optimistic') {
          const { items, total, page } = get();
          const newItems = items.filter((i) => i.id !== id);
          const newTotal = Math.max(0, total - 1);

          if (newItems.length === 0 && page > 1) {
            set({ page: page - 1 });
            await config.api.remove(id);
            await get().fetch();
            return;
          }

          set({ items: newItems, total: newTotal });

          try {
            await config.api.remove(id);
          } catch (error) {
            await get().fetch();
            throw error;
          }
        } else {
          await config.api.remove(id);
          const { items, page } = get();
          const newItems = items.filter((i) => i.id !== id);
          if (newItems.length === 0 && page > 1) {
            set({ page: page - 1 });
          }
          await get().fetch();
        }
      },

      removeBatch: async (ids: string[]) => {
        const removeApi = config.api.removeBatch;
        if (!removeApi) {
          for (const id of ids) {
            await get().remove(id);
          }
          return;
        }

        if (config.deleteStrategy === 'optimistic') {
          const { items, total, page } = get();
          const idSet = new Set(ids);
          const newItems = items.filter((i) => !idSet.has(i.id));
          const newTotal = Math.max(0, total - ids.length);

          if (newItems.length === 0 && page > 1) {
            set({ page: page - 1, selectedIds: new Set(), selectedItems: [] });
            await removeApi(ids);
            await get().fetch();
            return;
          }

          set({
            items: newItems,
            total: newTotal,
            selectedIds: new Set(),
            selectedItems: [],
          });

          try {
            await removeApi(ids);
          } catch (error) {
            await get().fetch();
            throw error;
          }
        } else {
          await removeApi(ids);
          set({ selectedIds: new Set(), selectedItems: [] });
          await get().fetch();
        }
      },

      update: async (id: string, input: U) => {
        if (config.updateStrategy === 'optimistic') {
          const { items } = get();
          const oldItem = items.find((i) => i.id === id);
          if (!oldItem) throw new Error(`Item ${id} not found`);

          set({
            items: items.map((i) => (i.id === id ? ({ ...i, ...input } as T) : i)),
          });

          try {
            const updated = await config.api.update(id, input);
            set({
              items: get().items.map((i) => (i.id === id ? updated : i)),
            });
            return updated;
          } catch (error) {
            set({
              items: get().items.map((i) => (i.id === id ? oldItem : i)),
            });
            throw error;
          }
        }

        const updated = await config.api.update(id, input);
        await get().fetch();
        return updated;
      },

      updateItem: (id: string, patch: Partial<T>) => {
        set({
          items: get().items.map((i) => (i.id === id ? ({ ...i, ...patch } as T) : i)),
        });
      },

      removeItem: (id: string) => {
        const { items, total } = get();
        set({
          items: items.filter((i) => i.id !== id),
          total: Math.max(0, total - 1),
        });
      },

      prependItem: (item: T) => {
        const { items, total, page } = get();
        if (page === 1) {
          set({ items: [item, ...items], total: total + 1 });
        } else {
          set({ total: total + 1 });
        }
      },
    } satisfies ListState<T> & ListActions<T, C, U>;
  });
}
