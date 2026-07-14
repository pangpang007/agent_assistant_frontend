import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createListStore } from './listStoreFactory';
import type { ListApiResponse, ListQueryParams } from '@/types/list';

interface Item {
  id: string;
  name: string;
}

function makeApi(overrides?: Partial<{
  list: (params: ListQueryParams) => Promise<ListApiResponse<Item>>;
  remove: (id: string) => Promise<void>;
  create: (input: { name: string }) => Promise<Item>;
  update: (id: string, input: Partial<Item>) => Promise<Item>;
}>) {
  const items: Item[] = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ];

  return {
    list: vi.fn(async (params: ListQueryParams): Promise<ListApiResponse<Item>> => ({
      items: params.page === 2 ? [{ id: 'c', name: 'C' }] : items,
      total: 3,
      page: params.page,
      pageSize: params.pageSize,
    })),
    create: vi.fn(async (input: { name: string }) => ({ id: 'n', name: input.name })),
    remove: vi.fn(async () => undefined),
    update: vi.fn(async (id: string, input: Partial<Item>) => ({
      id,
      name: input.name ?? 'x',
    })),
    ...overrides,
  };
}

describe('createListStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetch sets items and total from API', async () => {
    const api = makeApi();
    const useStore = createListStore<Item, { name: string }, Partial<Item>>({
      api,
      deleteStrategy: 'optimistic',
      createStrategy: 'optimistic',
      createInsertPosition: 'prepend',
      updateStrategy: 'optimistic',
    });

    await useStore.getState().fetch();
    expect(useStore.getState().items).toHaveLength(2);
    expect(useStore.getState().total).toBe(3);
  });

  it('optimistic remove decrements total and rolls back on failure', async () => {
    const api = makeApi({
      remove: vi.fn(async () => {
        throw new Error('fail');
      }),
    });
    const useStore = createListStore<Item, { name: string }, Partial<Item>>({
      api,
      deleteStrategy: 'optimistic',
      createStrategy: 'refetch',
      updateStrategy: 'refetch',
    });

    await useStore.getState().fetch();
    await expect(useStore.getState().remove('a')).rejects.toThrow('fail');
    expect(api.list).toHaveBeenCalledTimes(2);
    expect(useStore.getState().total).toBe(3);
  });

  it('optimistic remove on last item of page > 1 goes to previous page', async () => {
    const api = makeApi({
      list: vi.fn(async (params: ListQueryParams) => {
        if (params.page === 2) {
          return { items: [{ id: 'c', name: 'C' }], total: 3, page: 2, pageSize: 2 };
        }
        return {
          items: [
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B' },
          ],
          total: 2,
          page: 1,
          pageSize: 2,
        };
      }),
    });

    const useStore = createListStore<Item, { name: string }, Partial<Item>>({
      api,
      defaultPageSize: 2,
      deleteStrategy: 'optimistic',
      createStrategy: 'refetch',
      updateStrategy: 'refetch',
    });

    useStore.setState({ page: 2 });
    await useStore.getState().fetch();
    expect(useStore.getState().items).toEqual([{ id: 'c', name: 'C' }]);

    await useStore.getState().remove('c');
    expect(useStore.getState().page).toBe(1);
    expect(api.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });

  it('optimistic create prepends on page 1', async () => {
    const api = makeApi();
    const useStore = createListStore<Item, { name: string }, Partial<Item>>({
      api,
      deleteStrategy: 'optimistic',
      createStrategy: 'optimistic',
      createInsertPosition: 'prepend',
      updateStrategy: 'optimistic',
    });

    await useStore.getState().fetch();
    await useStore.getState().create({ name: 'New' });
    expect(useStore.getState().items[0]?.name).toBe('New');
    expect(useStore.getState().total).toBe(4);
  });

  it('setPage clears selection', async () => {
    const api = makeApi();
    const useStore = createListStore<Item, { name: string }, Partial<Item>>({
      api,
      deleteStrategy: 'optimistic',
      createStrategy: 'refetch',
      updateStrategy: 'refetch',
    });

    await useStore.getState().fetch();
    useStore.getState().selectItem('a');
    expect(useStore.getState().selectedIds.has('a')).toBe(true);
    useStore.getState().setPage(1);
    expect(useStore.getState().selectedIds.size).toBe(0);
  });
});
