---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 4263223131904378_0-data_volume/7650412177643372840-files/所有对话/主对话/supplement_列表页状态管理规范.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 4263223131904378#1784052047957
    ReservedCode2: ""
---
# 全平台列表页状态管理规范

> **本文档面向 Cursor AI 代码生成**。请严格按照本文档的规范实现所有列表页的状态管理，不要自行发挥。
> 
> **技术栈**：Vite + React + TypeScript + Zustand + Axios + Ant Design 5 + Tailwind CSS
> 
> **Bug 根因**：当前工作流列表页删除后 total 未更新，原因是各页面刷新策略不一致，开发者（AI）自行猜测实现。本文档统一所有规则。

---

## 1. 目标

1. 所有列表页共享统一的状态管理模式（Zustand store + useListPage hook）
2. 所有增删改操作后的刷新策略有明确定义，不再允许 AI 猜测
3. total 永远来自 API 响应，禁止本地 `total - 1` 这种计算
4. 分页边界情况统一处理（当前页删空后回退、创建后不跳页等）

---

## 2. 通用架构

### 2.1 分层结构

```
src/
  stores/
    listStoreFactory.ts   ← 通用列表 store 工厂函数
  hooks/
    useListPage.ts         ← 通用列表页 hook
  types/
    list.ts                ← 通用类型定义
  api/
    listTypes.ts           ← API 响应类型
  pages/
    workflows/
      store.ts             ← 工作流列表 store（调用工厂）
      hooks.ts             ← 工作流列表 hook（调用 useListPage）
    agents/
      store.ts
      hooks.ts
    ... (每个列表页同理)
```

### 2.2 通用类型定义

```typescript
// src/types/list.ts

/** 列表页查询参数 */
export interface ListQueryParams {
  page: number;           // 从 1 开始
  pageSize: number;       // 默认 20，可选 10/20/50
  keyword?: string;       // 搜索关键词
  sortBy?: string;        // 排序字段
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;     // 各页面自定义筛选条件
}

/** API 标准分页响应（后端必须遵守此格式） */
export interface ListApiResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 列表 store 的状态接口 */
export interface ListState<T> {
  // 数据
  items: T[];
  total: number;
  
  // 分页
  page: number;
  pageSize: number;
  
  // 筛选与排序
  keyword: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, any>;
  
  // UI 状态
  loading: boolean;
  loadingMore: boolean;     // 加载更多时的 loading（不覆盖数据）
  
  // 选中状态
  selectedIds: Set<string>;
  selectedItems: T[];
}

/** 列表 store 的 action 接口 */
export interface ListActions<T, CreateInput = any, UpdateInput = any> {
  // 数据操作
  fetch: () => Promise<void>;
  fetchMore: () => Promise<void>;   // 加载更多（下一页追加）
  
  // 筛选分页
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setKeyword: (keyword: string) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setFilters: (filters: Record<string, any>) => void;
  resetFilters: () => void;
  
  // 选中
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // 增删改 —— 这些方法的刷新策略在各页面单独配置
  create: (input: CreateInput) => Promise<T>;
  remove: (id: string) => Promise<void>;
  removeBatch: (ids: string[]) => Promise<void>;
  update: (id: string, input: UpdateInput) => Promise<T>;
  
  // 局部更新（乐观更新用）
  updateItem: (id: string, patch: Partial<T>) => void;
  removeItem: (id: string) => void;   // 直接从 items 移除，total - 1
  prependItem: (item: T) => void;     // 插入到第一页头部，total + 1
}

/** 列表配置 —— 每个页面创建 store 时传入 */
export interface ListConfig<T, CreateInput = any, UpdateInput = any> {
  /** API 函数 */
  api: {
    list: (params: ListQueryParams) => Promise<ListApiResponse<T>>;
    create: (input: CreateInput) => Promise<T>;
    remove: (id: string) => Promise<void>;
    removeBatch?: (ids: string[]) => Promise<void>;
    update: (id: string, input: UpdateInput) => Promise<T>;
  };
  
  /** 默认分页大小 */
  defaultPageSize?: number;
  
  /** 默认排序 */
  defaultSort?: { sortBy: string; sortOrder: 'asc' | 'desc' };
  
  /** 删除策略 */
  deleteStrategy: 'optimistic' | 'refetch';
  
  /** 创建策略 */
  createStrategy: 'optimistic' | 'refetch';
  
  /** 更新策略 */
  updateStrategy: 'optimistic' | 'refetch';
  
  /** 创建后插入位置：'prepend' = 插到当前页头部，'refetch' = 刷新当前页 */
  createInsertPosition?: 'prepend' | 'refetch';
}
```

### 2.3 Store 工厂函数

```typescript
// src/stores/listStoreFactory.ts

import { create } from 'zustand';
import type { ListState, ListActions, ListConfig, ListApiResponse } from '@/types/list';

type ListStore<T, C = any, U = any> = ListState<T> & ListActions<T, C, U>;

/**
 * 创建列表页 store 的工厂函数。
 * 每个列表页调用此函数，传入各自的 API 和策略配置，生成独立的 Zustand store。
 */
export function createListStore<T extends { id: string }, C = any, U = any>(
  config: ListConfig<T, C, U>
) {
  const defaultPageSize = config.defaultPageSize ?? 20;
  
  return create<ListStore<T, C, U>>((set, get) => ({
    // ========== 初始状态 ==========
    items: [],
    total: 0,
    page: 1,
    pageSize: defaultPageSize,
    keyword: '',
    sortBy: config.defaultSort?.sortBy ?? 'createdAt',
    sortOrder: config.defaultSort?.sortOrder ?? 'desc',
    filters: {},
    loading: false,
    loadingMore: false,
    selectedIds: new Set(),
    selectedItems: [],
    
    // ========== 数据请求 ==========
    fetch: async () => {
      const { page, pageSize, keyword, sortBy, sortOrder, filters } = get();
      set({ loading: true });
      try {
        const res = await config.api.list({
          page,
          pageSize,
          keyword,
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
      if (items.length >= total) return; // 已加载全部
      
      const nextPage = page + 1;
      set({ loadingMore: true });
      try {
        const res = await config.api.list({
          page: nextPage,
          pageSize,
          keyword,
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
    
    // ========== 分页 & 筛选 ==========
    setPage: (page: number) => {
      set({ page });
      get().fetch();
    },
    
    setPageSize: (pageSize: number) => {
      set({ pageSize, page: 1 });
      get().fetch();
    },
    
    setKeyword: (keyword: string) => {
      set({ keyword, page: 1 });
      get().fetch();
    },
    
    setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => {
      set({ sortBy, sortOrder, page: 1 });
      get().fetch();
    },
    
    setFilters: (filters: Record<string, any>) => {
      set({ filters, page: 1 });
      get().fetch();
    },
    
    resetFilters: () => {
      set({ filters: {}, keyword: '', sortBy: config.defaultSort?.sortBy ?? 'createdAt', sortOrder: config.defaultSort?.sortOrder ?? 'desc', page: 1 });
      get().fetch();
    },
    
    // ========== 选中 ==========
    selectItem: (id: string) => {
      const { selectedIds, items } = get();
      const newSet = new Set(selectedIds);
      newSet.add(id);
      set({
        selectedIds: newSet,
        selectedItems: items.filter(i => newSet.has(i.id)),
      });
    },
    
    deselectItem: (id: string) => {
      const { selectedIds, items } = get();
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      set({
        selectedIds: newSet,
        selectedItems: items.filter(i => newSet.has(i.id)),
      });
    },
    
    selectAll: () => {
      const { items } = get();
      const ids = new Set(items.map(i => i.id));
      set({ selectedIds: ids, selectedItems: [...items] });
    },
    
    clearSelection: () => {
      set({ selectedIds: new Set(), selectedItems: [] });
    },
    
    // ========== 增删改 ==========
    create: async (input: C) => {
      const newItem = await config.api.create(input);
      
      if (config.createStrategy === 'optimistic' && config.createInsertPosition === 'prepend') {
        // 乐观插入到第一页头部（仅当当前在第 1 页时）
        const { page, items, total } = get();
        if (page === 1) {
          set({
            items: [newItem, ...items],
            total: total + 1,
          });
        } else {
          // 不在第一页，只刷新当前页
          await get().fetch();
        }
      } else {
        // refetch 策略：刷新当前页
        await get().fetch();
      }
      
      return newItem;
    },
    
    remove: async (id: string) => {
      if (config.deleteStrategy === 'optimistic') {
        // 乐观删除：先从 UI 移除，再调 API
        const { items, total, page, pageSize } = get();
        const newItems = items.filter(i => i.id !== id);
        const newTotal = total - 1;
        
        // 当前页删空了且不是第一页 → 回退到上一页
        if (newItems.length === 0 && page > 1) {
          set({ page: page - 1 });
          await config.api.remove(id);
          await get().fetch(); // 回退后重新请求上一页数据
          return;
        }
        
        set({
          items: newItems,
          total: newTotal,
        });
        
        try {
          await config.api.remove(id);
          // API 成功，无需额外操作（乐观更新已完成）
        } catch (error) {
          // API 失败 → 回滚：重新请求当前页
          await get().fetch();
          throw error;
        }
      } else {
        // refetch 策略：先调 API，成功后刷新
        await config.api.remove(id);
        
        const { items, total, page } = get();
        const newTotal = total - 1;
        const newItems = items.filter(i => i.id !== id);
        
        // 当前页删空且不是第一页 → 回退
        if (newItems.length === 0 && page > 1) {
          set({ page: page - 1 });
        }
        
        await get().fetch();
      }
    },
    
    removeBatch: async (ids: string[]) => {
      const removeApi = config.api.removeBatch;
      if (!removeApi) {
        // 没有批量删除 API，循环单个删除
        for (const id of ids) {
          await get().remove(id);
        }
        return;
      }
      
      if (config.deleteStrategy === 'optimistic') {
        const { items, total, page, pageSize } = get();
        const idSet = new Set(ids);
        const newItems = items.filter(i => !idSet.has(i.id));
        const newTotal = total - ids.length;
        
        if (newItems.length === 0 && page > 1) {
          set({ page: page - 1 });
          await removeApi(ids);
          await get().fetch();
          return;
        }
        
        set({ items: newItems, total: newTotal, selectedIds: new Set(), selectedItems: [] });
        
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
        // 乐观更新：先更新 UI，再调 API
        const { items } = get();
        const oldItem = items.find(i => i.id === id);
        if (!oldItem) throw new Error(`Item ${id} not found`);
        
        // 先用 input 中的字段更新 UI（假设 input 是 Partial）
        set({
          items: items.map(i => i.id === id ? { ...i, ...input } as T : i),
        });
        
        try {
          const updated = await config.api.update(id, input);
          // API 返回权威数据，用服务端数据覆盖
          set({
            items: get().items.map(i => i.id === id ? updated : i),
          });
          return updated;
        } catch (error) {
          // 回滚
          set({
            items: get().items.map(i => i.id === id ? oldItem : i),
          });
          throw error;
        }
      } else {
        // refetch：先调 API，成功后刷新当前页
        const updated = await config.api.update(id, input);
        await get().fetch();
        return updated;
      }
    },
    
    // ========== 局部操作（供外部精确控制） ==========
    updateItem: (id: string, patch: Partial<T>) => {
      set({
        items: get().items.map(i => i.id === id ? { ...i, ...patch } as T : i),
      });
    },
    
    removeItem: (id: string) => {
      const { items, total } = get();
      set({
        items: items.filter(i => i.id !== id),
        total: total - 1,
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
  }));
}
```

---

## 3. 刷新策略总规则（核心）

### 3.1 策略选择矩阵

| 操作 | 默认策略 | 理由 |
|------|----------|------|
| **创建** | `optimistic` + `prepend` | 用户期望立即看到新建项；插入到第一页头部最自然 |
| **删除（单个）** | `optimistic` | 删除无需等待确认；UI 应立即响应 |
| **删除（批量）** | `optimistic` | 同上 |
| **编辑（重命名等轻量）** | `optimistic` | 名称变更应立即显示 |
| **编辑（复杂表单）** | `refetch` | 复杂编辑可能涉及关联数据，用服务端数据兜底 |
| **复制** | `refetch` | 复制产生新记录，ID 不确定，刷新最安全 |
| **导出** | 无刷新 | 导出操作不影响列表数据 |
| **切换启用状态** | `optimistic` | 开关类操作必须立即响应 |
| **测试** | 无刷新 | 测试操作不影响列表数据 |

### 3.2 删除后分页边界处理（必须严格遵守）

```
场景：用户在第 N 页删除了一条记录
  ├─ 当前页还有数据 → 正常显示，total - 1
  ├─ 当前页删空了 + N > 1 → 自动跳转到第 N-1 页，请求上一页数据
  └─ 当前页删空了 + N == 1 → 显示空状态（empty state），total = 0
```

**代码实现已在 store 工厂的 `remove` 方法中完成，各页面不需要额外处理。**

### 3.3 创建后分页处理

```
场景：用户创建了一条新记录
  ├─ 当前在第 1 页 → 插入到列表头部，total + 1
  ├─ 当前不在第 1 页 → 不跳页，只 total + 1（或刷新当前页，取决于配置）
  └─ 有筛选条件 → 如果新记录不满足筛选条件，不插入，仅 total + 1
```

### 3.4 total 更新规则

**铁律：total 永远从 API 响应的 `res.total` 获取。**

- `fetch()` 后：`total = res.total`
- 乐观删除后：`total = total - 1`（这是唯一允许本地计算 total 的场景）
- 乐观创建后：`total = total + 1`（同上，仅限乐观更新场景）
- 乐观更新失败回滚后：重新 `fetch()` 获取正确的 total
- **严禁**：在 `setFilters`、`setKeyword`、`setSort` 后本地计算 total

---

## 4. useListPage Hook

```typescript
// src/hooks/useListPage.ts

import { useEffect, useCallback, useRef } from 'react';
import type { ListState, ListActions } from '@/types/list';

/**
 * 通用列表页 hook。
 * 封装初始化加载、防抖搜索、组件卸载清理等通用逻辑。
 * 
 * @param store - 各页面通过 createListStore 创建的 store
 * @param options - 可选配置
 */
export function useListPage<T extends { id: string }, C = any, U = any>(
  store: () => ListState<T> & ListActions<T, C, U>,
  options?: {
    /** 是否在 mount 时自动加载第一页，默认 true */
    autoFetch?: boolean;
    /** 搜索防抖延迟 ms，默认 300 */
    searchDebounceMs?: number;
    /** 外部依赖变化时是否重新加载（如路由参数变化） */
    deps?: any[];
  }
) {
  const state = store();
  const { autoFetch = true, searchDebounceMs = 300, deps = [] } = options ?? {};
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  
  // 自动加载
  useEffect(() => {
    if (autoFetch) {
      state.fetch();
    }
  }, deps);
  
  // 防抖搜索
  const debouncedSearch = useCallback((keyword: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      state.setKeyword(keyword);
    }, searchDebounceMs);
  }, []);
  
  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  
  return {
    ...state,
    debouncedSearch,
    /** 当前页是否为空（用于显示 empty state） */
    isEmpty: !state.loading && state.items.length === 0,
    /** 是否还有更多数据 */
    hasMore: state.items.length < state.total,
  };
}
```

---

## 5. 各列表页具体配置

### 5.1 工作流列表 `/workflows`

```typescript
// src/pages/workflows/store.ts

import { createListStore } from '@/stores/listStoreFactory';
import { workflowApi } from '@/api/workflow';
import type { Workflow } from '@/types/workflow';

export const useWorkflowListStore = createListStore<Workflow, WorkflowCreateInput, WorkflowUpdateInput>({
  api: {
    list: workflowApi.list,
    create: workflowApi.create,
    remove: workflowApi.remove,
    removeBatch: workflowApi.removeBatch,
    update: workflowApi.update,
  },
  defaultPageSize: 20,
  defaultSort: { sortBy: 'updatedAt', sortOrder: 'desc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'optimistic',
  createInsertPosition: 'prepend',
  updateStrategy: 'optimistic',
});
```

**操作后刷新策略：**

| 操作 | 策略 | 详细说明 |
|------|------|----------|
| 创建工作流 | 乐观插入第1页头部 | 新建成功后立即显示在列表顶部 |
| 删除工作流 | 乐观移除 | 卡片立即消失，total - 1；当前页空则回退上一页 |
| 重命名 | 乐观更新 | 名称立即变化，API 返回后覆盖确认 |
| 复制工作流 | refetch 当前页 | 复制产生新 ID 的工作流，刷新最安全 |
| 导出工作流 | 无刷新 | 导出是下载操作，不影响列表 |
| 批量删除 | 乐观移除 | 同单个删除逻辑，清除选中状态 |

**特殊场景：**
- 删除最后一个工作流（当前页仅剩1条且为第1页）：显示空状态引导创建
- 从模板创建工作流：等同于创建，乐观插入第1页头部

---

### 5.2 Agent 列表 `/agents`

```typescript
// src/pages/agents/store.ts

import { createListStore } from '@/stores/listStoreFactory';
import { agentApi } from '@/api/agent';
import type { Agent } from '@/types/agent';

export const useAgentListStore = createListStore<Agent, AgentCreateInput, AgentUpdateInput>({
  api: {
    list: agentApi.list,
    create: agentApi.create,
    remove: agentApi.remove,
    removeBatch: agentApi.removeBatch,
    update: agentApi.update,
  },
  defaultPageSize: 20,
  defaultSort: { sortBy: 'updatedAt', sortOrder: 'desc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'optimistic',
  createInsertPosition: 'prepend',
  updateStrategy: 'optimistic',
});
```

**操作后刷新策略：**

| 操作 | 策略 | 详细说明 |
|------|------|----------|
| 创建 Agent | 乐观插入第1页头部 | 同工作流创建 |
| 删除 Agent | 乐观移除 | 同工作流删除 |
| 复制 Agent | refetch 当前页 | 同工作流复制 |

---

### 5.3 工具列表 `/tools`

```typescript
// src/pages/tools/store.ts

import { createListStore } from '@/stores/listStoreFactory';
import { toolApi } from '@/api/tool';
import type { Tool } from '@/types/tool';

export const useToolListStore = createListStore<Tool, ToolCreateInput, ToolUpdateInput>({
  api: {
    list: toolApi.list,
    create: toolApi.create,
    remove: toolApi.remove,
    removeBatch: undefined,  // 工具列表不支持批量删除
    update: toolApi.update,
  },
  defaultPageSize: 20,
  defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'optimistic',
  createInsertPosition: 'prepend',
  updateStrategy: 'refetch',   // 工具编辑涉及参数定义等复杂结构，用 refetch
});
```

**操作后刷新策略：**

| 操作 | 策略 | 详细说明 |
|------|------|----------|
| 创建工具 | 乐观插入第1页头部 | 新建后立即显示 |
| 删除工具 | 乐观移除 | 卡片立即消失 |
| 编辑工具 | refetch 当前页 | 工具编辑可能修改输入输出参数 schema，用服务端数据覆盖 |
| 测试工具 | 无刷新 | 测试弹窗独立，不影响列表 |

---

### 5.4 模型 Provider 列表 `/settings/models`

```typescript
// src/pages/settings/models/store.ts

import { createListStore } from '@/stores/listStoreFactory';
import { modelApi } from '@/api/model';
import type { ModelProvider } from '@/types/model';

export const useModelListStore = createListStore<ModelProvider, ModelCreateInput, ModelUpdateInput>({
  api: {
    list: modelApi.list,
    create: modelApi.create,
    remove: modelApi.remove,
    removeBatch: undefined,
    update: modelApi.update,
  },
  defaultPageSize: 50,   // 模型数量通常不多，一页显示更多
  defaultSort: { sortBy: 'name', sortOrder: 'asc' },
  deleteStrategy: 'refetch',   // 删除 Provider 可能影响关联的模型数据，用 refetch
  createStrategy: 'refetch',   // 创建后需要验证 API Key 有效性，用 refetch
  updateStrategy: 'optimistic', // 启用/禁用切换必须立即响应
});
```

**操作后刷新策略：**

| 操作 | 策略 | 详细说明 |
|------|------|----------|
| 创建 Provider | refetch 当前页 | 需要后端验证 API Key，成功后刷新 |
| 删除 Provider | refetch 当前页 | 删除关联数据复杂，用 refetch 兜底 |
| 编辑 Provider | refetch 当前页 | 同上 |
| 切换启用/禁用 | 乐观更新 | **开关操作必须立即响应**，直接 toggle 本地状态 |

**特殊处理 — 启用/禁用切换：**
```typescript
// 在组件中调用
const toggleEnabled = async (id: string, enabled: boolean) => {
  const store = useModelListStore.getState();
  // 乐观更新 UI
  store.updateItem(id, { enabled });
  try {
    await modelApi.update(id, { enabled });
  } catch {
    // 失败回滚
    store.updateItem(id, { enabled: !enabled });
  }
};
```

---

### 5.5 知识库列表 `/knowledge`

```typescript
// src/pages/knowledge/store.ts

import { createListStore } from '@/stores/listStoreFactory';
import { knowledgeApi } from '@/api/knowledge';
import type { KnowledgeBase } from '@/types/knowledge';

export const useKnowledgeListStore = createListStore<KnowledgeBase, KnowledgeCreateInput, KnowledgeUpdateInput>({
  api: {
    list: knowledgeApi.list,
    create: knowledgeApi.create,
    remove: knowledgeApi.remove,
    removeBatch: undefined,
    update: knowledgeApi.update,
  },
  defaultPageSize: 20,
  defaultSort: { sortBy: 'updatedAt', sortOrder: 'desc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'refetch',    // 知识库创建涉及文件上传/解析，状态不是立即可用的，用 refetch
  updateStrategy: 'optimistic',
});
```

**操作后刷新策略：**

| 操作 | 策略 | 详细说明 |
|------|------|----------|
| 创建知识库 | refetch 当前页 | 创建后可能进入"解析中"状态，让服务端返回准确状态 |
| 删除知识库 | 乐观移除 | 立即消失 |
| 编辑知识库 | 乐观更新 | 重命名等轻量操作立即响应 |

---

### 5.6 模板列表 `/templates`

```typescript
// src/pages/templates/store.ts

import { createListStore } from '@/stores/listStoreFactory';
import { templateApi } from '@/api/template';
import type { Template } from '@/types/template';

export const useTemplateListStore = createListStore<Template, never, never>({
  api: {
    list: templateApi.list,
    create: () => { throw new Error('Templates cannot be created by user'); },
    remove: templateApi.remove,
    removeBatch: undefined,
    update: () => { throw new Error('Templates cannot be updated by user'); },
  },
  defaultPageSize: 20,
  defaultSort: { sortBy: 'usageCount', sortOrder: 'desc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'refetch',   // 不支持创建，但类型需要
  updateStrategy: 'refetch',   // 不支持更新，但类型需要
});
```

**操作后刷新策略：**

| 操作 | 策略 | 详细说明 |
|------|------|----------|
| 删除模板 | 乐观移除 | 立即消失 |
| 使用模板 | 无刷新 | 使用模板跳转到工作流编辑器，列表不变 |

---

### 5.7 环境变量列表 `/settings/env`

```typescript
// src/pages/settings/env/store.ts

import { createListStore } from '@/stores/listStoreFactory';
import { envApi } from '@/api/env';
import type { EnvVariable } from '@/types/env';

export const useEnvListStore = createListStore<EnvVariable, EnvCreateInput, EnvUpdateInput>({
  api: {
    list: envApi.list,
    create: envApi.create,
    remove: envApi.remove,
    removeBatch: envApi.removeBatch,
    update: envApi.update,
  },
  defaultPageSize: 50,    // 环境变量通常较多，大页
  defaultSort: { sortBy: 'key', sortOrder: 'asc' },
  deleteStrategy: 'optimistic',
  createStrategy: 'optimistic',
  createInsertPosition: 'prepend',
  updateStrategy: 'optimistic',
});
```

**操作后刷新策略：**

| 操作 | 策略 | 详细说明 |
|------|------|----------|
| 创建环境变量 | 乐观插入第1页头部 | 立即显示 |
| 删除环境变量 | 乐观移除 | 立即消失 |
| 编辑环境变量 | 乐观更新 | 立即变化，API 确认 |
| 批量删除 | 乐观移除 | 同工作流批量删除 |

**特殊注意：** 环境变量的值在前端应脱敏显示（`****`），编辑时不回填真实值。

---

### 5.8 执行历史列表 `/executions`

```typescript
// src/pages/executions/store.ts

import { create } from 'zustand';
import { executionApi } from '@/api/execution';
import type { Execution } from '@/types/execution';
import type { ListQueryParams, ListApiResponse } from '@/types/list';

/**
 * 执行历史列表比较特殊：无创建/删除，只有查看和取消。
 * 不使用 createListStore 工厂，手写简化版 store。
 */
interface ExecutionListState {
  items: Execution[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  keyword: string;
  statusFilter: string | null;   // 'running' | 'success' | 'failed' | 'cancelled' | null
  
  fetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setKeyword: (keyword: string) => void;
  setStatusFilter: (status: string | null) => void;
  cancelExecution: (id: string) => Promise<void>;
}

export const useExecutionListStore = create<ExecutionListState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  keyword: '',
  statusFilter: null,
  
  fetch: async () => {
    const { page, pageSize, keyword, statusFilter } = get();
    set({ loading: true });
    try {
      const res = await executionApi.list({ page, pageSize, keyword, status: statusFilter ?? undefined });
      set({ items: res.items, total: res.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  
  setPage: (page) => { set({ page }); get().fetch(); },
  setPageSize: (pageSize) => { set({ pageSize, page: 1 }); get().fetch(); },
  setKeyword: (keyword) => { set({ keyword, page: 1 }); get().fetch(); },
  setStatusFilter: (statusFilter) => { set({ statusFilter, page: 1 }); get().fetch(); },
  
  cancelExecution: async (id: string) => {
    await executionApi.cancel(id);
    // 取消后 refetch 当前页，获取最新状态
    await get().fetch();
  },
}));
```

**操作后刷新策略：**

| 操作 | 策略 | 详细说明 |
|------|------|----------|
| 查看执行详情 | 无刷新 | 跳转详情页，列表不变 |
| 取消执行 | refetch 当前页 | 取消后状态变化（running → cancelled），需刷新 |

**特殊处理 — 自动刷新：**
执行历史列表在有 running 状态的执行时，应启动定时轮询（每 5 秒）：
```typescript
useEffect(() => {
  const hasRunning = state.items.some(i => i.status === 'running');
  if (!hasRunning) return;
  
  const timer = setInterval(() => {
    state.fetch();
  }, 5000);
  
  return () => clearInterval(timer);
}, [state.items.some(i => i.status === 'running')]);
```

---

### 5.9 日志列表 `/logs`

```typescript
// src/pages/logs/store.ts

import { create } from 'zustand';
import { logApi } from '@/api/log';
import type { LogEntry } from '@/types/log';

/**
 * 日志列表是只读的，不需要增删改操作。
 */
interface LogListState {
  items: LogEntry[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  levelFilter: string | null;    // 'debug' | 'info' | 'warn' | 'error' | null
  keyword: string;
  timeRange: [string, string] | null;  // [startISO, endISO]
  
  fetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setKeyword: (keyword: string) => void;
  setLevelFilter: (level: string | null) => void;
  setTimeRange: (range: [string, string] | null) => void;
}

export const useLogListStore = create<LogListState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 50,    // 日志默认大页
  loading: false,
  levelFilter: null,
  keyword: '',
  timeRange: null,
  
  fetch: async () => {
    const { page, pageSize, keyword, levelFilter, timeRange } = get();
    set({ loading: true });
    try {
      const res = await logApi.list({
        page,
        pageSize,
        keyword,
        level: levelFilter ?? undefined,
        startTime: timeRange?.[0],
        endTime: timeRange?.[1],
      });
      set({ items: res.items, total: res.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  
  setPage: (page) => { set({ page }); get().fetch(); },
  setPageSize: (pageSize) => { set({ pageSize, page: 1 }); get().fetch(); },
  setKeyword: (keyword) => { set({ keyword, page: 1 }); get().fetch(); },
  setLevelFilter: (levelFilter) => { set({ levelFilter, page: 1 }); get().fetch(); },
  setTimeRange: (timeRange) => { set({ timeRange, page: 1 }); get().fetch(); },
}));
```

**操作后刷新策略：**

| 操作 | 策略 | 详细说明 |
|------|------|----------|
| 查看日志详情 | 无刷新 | 展开行或弹窗，不影响列表 |
| 切换筛选 | refetch | 切换 level/时间范围后重新请求 |

**特殊处理 — 实时日志：**
如果日志页支持实时模式（WebSocket），则在实时模式下：
- 禁用分页，使用流式追加
- 新日志 append 到 items 尾部
- 保持最大 1000 条，超出后移除最早的

---

## 6. API 响应类型与错误处理

### 6.1 API 函数签名规范

所有列表页的 API 模块必须遵循以下签名：

```typescript
// src/api/listTypes.ts

export interface ListApiFunctions<T, C = any, U = any> {
  list: (params: ListQueryParams) => Promise<ListApiResponse<T>>;
  create: (input: C) => Promise<T>;
  remove: (id: string) => Promise<void>;
  removeBatch?: (ids: string[]) => Promise<void>;
  update: (id: string, input: U) => Promise<T>;
}
```

### 6.2 错误处理

```typescript
// src/utils/apiErrorHandler.ts

import { message } from 'antd';

/**
 * 统一的 API 错误处理。
 * 在 store 工厂中已内置 catch，但页面层可以在调用时额外处理。
 */
export function handleApiError(error: unknown, context: string): void {
  if (error instanceof Error) {
    // 业务错误（后端返回的 message）
    if ('response' in error && (error as any).response?.data?.message) {
      message.error(`${context}失败：${(error as any).response.data.message}`);
    } else {
      message.error(`${context}失败：${error.message}`);
    }
  } else {
    message.error(`${context}失败：未知错误`);
  }
}
```

### 6.3 在组件中使用

```tsx
// 示例：工作流列表页组件

import { useWorkflowListStore } from './store';
import { useListPage } from '@/hooks/useListPage';
import { handleApiError } from '@/utils/apiErrorHandler';

export default function WorkflowListPage() {
  const listPage = useListPage(useWorkflowListStore);
  
  const handleDelete = async (id: string) => {
    try {
      await listPage.remove(id);
      message.success('删除成功');
    } catch (error) {
      handleApiError(error, '删除工作流');
      // 乐观更新失败时 store 已自动回滚，这里只需提示用户
    }
  };
  
  const handleCreate = async (input: WorkflowCreateInput) => {
    try {
      const newWorkflow = await listPage.create(input);
      message.success('创建成功');
      return newWorkflow;
    } catch (error) {
      handleApiError(error, '创建工作流');
      throw error;
    }
  };
  
  // ... 渲染逻辑
}
```

---

## 7. 乐观更新 vs 重新请求 — 决策流程图

```
操作发生
  │
  ├─ 是"查看/导出/测试"类（不影响数据）→ 无刷新
  │
  ├─ 是"删除"类
  │   ├─ 数据关系简单（无外键关联）→ 乐观更新
  │   │   └─ API 失败 → 回滚（重新 fetch 当前页）
  │   └─ 数据关系复杂（删除 Provider 影响子模型）→ refetch
  │
  ├─ 是"创建"类
  │   ├─ 新对象可立即构造完整 → 乐观插入 prepend
  │   └─ 新对象需要后端处理（上传/验证/解析）→ refetch
  │
  ├─ 是"编辑"类
  │   ├─ 轻量编辑（名称/开关/描述）→ 乐观更新
  │   └─ 复杂编辑（参数 schema/配置结构）→ refetch
  │
  └─ 是"复制"类 → refetch（新 ID 不确定）
```

---

## 8. 汇总配置表

| 列表页 | delete | create | update | 特殊说明 |
|--------|--------|--------|--------|----------|
| 工作流 | optimistic | optimistic + prepend | optimistic | 标准列表 |
| Agent | optimistic | optimistic + prepend | optimistic | 标准列表 |
| 工具 | optimistic | optimistic + prepend | **refetch** | 编辑涉及 schema |
| 模型 Provider | **refetch** | **refetch** | optimistic | 删除/创建涉及验证 |
| 知识库 | optimistic | **refetch** | optimistic | 创建涉及文件解析 |
| 模板 | optimistic | N/A | N/A | 只读列表，只能删除和使用 |
| 环境变量 | optimistic | optimistic + prepend | optimistic | 标准列表 |
| 执行历史 | N/A | N/A | N/A | 只有查看和取消，取消用 refetch |
| 日志 | N/A | N/A | N/A | 纯只读 |

---

## 9. Cursor 实现指南

### 9.1 实现顺序

```
Phase A：基础设施（先做这些）
  A1. 创建 src/types/list.ts — 通用类型
  A2. 创建 src/stores/listStoreFactory.ts — store 工厂
  A3. 创建 src/hooks/useListPage.ts — 通用 hook
  A4. 创建 src/utils/apiErrorHandler.ts — 错误处理

Phase B：改造现有页面（按优先级）
  B1. 工作流列表 — 修复 total 不同步的 bug（最高优先级）
  B2. Agent 列表 — 结构最相似，可复制工作流模式
  B3. 环境变量列表 — 标准列表，快速改造
  B4. 工具列表 — 注意 updateStrategy 为 refetch
  B5. 知识库列表 — 注意 createStrategy 为 refetch
  B6. 模型 Provider 列表 — 注意启用/禁用开关的特殊处理

Phase C：特殊页面
  C1. 模板列表 — 只读+删除
  C2. 执行历史列表 — 手写 store，加轮询
  C3. 日志列表 — 手写 store，只读
```

### 9.2 各页面文件结构

每个使用工厂模式的列表页需要创建以下文件：

```
src/pages/{pageName}/
  store.ts     — 调用 createListStore，传入配置
  hooks.ts     — 调用 useListPage，封装页面级逻辑
  index.tsx    — 页面组件，使用 hooks.ts 返回的状态和方法
  components/  — 页面子组件
```

### 9.3 关键注意事项（坑）

1. **total 不同步 bug 修复**：
   - 旧代码中可能存在 `set({ total: state.total - 1 })` 这种本地计算
   - 改造后：乐观更新允许 `total - 1`，但失败时必须 `fetch()` 回滚到服务端准确值
   - refetch 策略下：total 始终来自 API 响应

2. **Zustand store 不要在组件内创建**：
   - `createListStore` 返回的 store 必须在模块顶层调用
   - 组件内通过 `useWorkflowListStore()` 消费

3. **分页组件绑定**：
   - 使用 Ant Design `<Pagination>` 组件
   - `current` 绑定 `state.page`
   - `total` 绑定 `state.total`（不是 `state.items.length`！）
   - `onChange` 调用 `state.setPage(page)`

4. **防抖搜索**：
   - 搜索框 `onChange` 调用 `listPage.debouncedSearch(value)`
   - 不要直接调用 `setKeyword`（会每次按键都请求）

5. **组件卸载时清理**：
   - `useListPage` 已内置清理防抖 timer
   - 执行历史的轮询 timer 需在 `useEffect` cleanup 中清理

6. **选中状态在翻页/筛选后清空**：
   - `setPage`、`setKeyword`、`setFilters` 等调用后应清空 `selectedIds`
   - 在 store 工厂的对应方法中加上 `clearSelection()` 调用：
   ```typescript
   setPage: (page: number) => {
     set({ page });
     get().clearSelection();  // ← 加上这行
     get().fetch();
   },
   ```

7. **乐观更新的 `update` 方法中 input 类型**：
   - 当 `updateStrategy: 'optimistic'` 时，工厂代码中假设 `input` 可以展开合并到 item
   - 如果 update API 的 input 类型与 item 字段不一致，需要在 API 层做转换
   - 或者将 `updateStrategy` 改为 `'refetch'`

8. **后端 API 要求**：
   - 所有列表接口必须返回 `{ items, total, page, pageSize }` 格式
   - `total` 是满足当前筛选条件的总数（不是全量总数）
   - 如果后端返回的是 `{ list, count }` 格式，需要在 API 层做适配：
   ```typescript
   list: async (params) => {
     const res = await axios.get('/api/workflows', { params });
     return {
       items: res.data.list,
       total: res.data.count,
       page: params.page,
       pageSize: params.pageSize,
     };
   },
   ```

9. **TypeScript 泛型约束**：
   - 所有列表项类型必须包含 `id: string` 字段
   - 如果后端用数字 ID，在类型层做转换：
   ```typescript
   interface Workflow {
     id: string;  // 前端统一用 string，API 层做 number → string 转换
     // ...
   }
   ```

10. **与现有 Phase 0-7 的衔接**：
    - Phase 0-7 已定义的路由结构、API 层、类型定义保持不变
    - 本次改造只影响 `stores/` 和 `hooks/` 层
    - 页面组件（`pages/`）需要适配新的 store API（主要是方法名变化）
    - 如果现有代码使用了 React Query，需要迁移到 Zustand（保持技术栈一致）

---

## 10. 测试用例（验证清单）

Cursor 实现完成后，需验证以下场景：

- [ ] 删除第 1 页的唯一一条记录 → 显示空状态
- [ ] 删除第 2 页的唯一一条记录 → 自动跳回第 1 页
- [ ] 删除第 2 页的多条记录至空 → 自动跳回第 1 页
- [ ] 批量删除跨页的记录 → 刷新当前页，total 正确
- [ ] 搜索后删除 → total 反映筛选后的数量
- [ ] 创建新记录 → 出现在第 1 页头部（第 1 页时）
- [ ] 在第 3 页创建 → 不跳页，total + 1
- [ ] 重命名 → 名称立即变化
- [ ] 乐观更新 API 失败 → UI 回滚到操作前状态
- [ ] 切换筛选条件 → total 从 API 获取（不是 0 或旧值）
- [ ] 快速连续删除 3 条 → total 正确递减
- [ ] 翻页后选中状态清空

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
