# Phase 7 — Dashboard + API 发布 + 全局打磨

> 状态：**已完成**

完成产品交付打磨：功能完整的 Dashboard、工作流发布为 API、全局搜索、错误/离线体验、路由懒加载与性能辅助组件。

## 文档

| 文档 | 用途 |
|------|------|
| [开发文档.md](./开发文档.md) | 完整规格：Dashboard、API 发布、搜索、空状态、错误边界、性能、响应式、Toast |
| [实施计划.md](./实施计划.md) | 分步实施与验收清单 |

## 已实现功能

- `/dashboard` 首页：欢迎语、快捷操作、统计卡片、最近工作流、Token 趋势（recharts）、最近执行
- `/` 重定向至 `/dashboard`；侧边栏 Dashboard 指向 `/dashboard`
- 编辑器工具栏「发布为 API」+ `PublishApiModal`（两步发布，CopyInput 复制 endpoint/apiKey）
- `/settings/api` 已发布 API 管理：列表、启用/停用、重置 Key、删除
- TopNav 全局搜索（⌘K）：防抖请求、分组结果、键盘导航
- 离线横幅（`useOnlineStatus`）+ 响应式侧边栏折叠（`useResponsiveSidebar`）
- ErrorBoundary / 404 / 500（`ErrorPage`）；根路径与首页入口统一到 Dashboard
- 路由懒加载 + `PageSkeleton`；画布性能辅助 `canvasPerformance`；`VirtualList` / `LazyImage` 组件就绪
- Toast 复用既有 `ToastProvider` / `useToastStore`（不另建平行体系）
- EmptyState 复用 `src/components/ui/EmptyState`，并提供 `emptyPresets`

## 关键路径

- `src/types/phase7.ts`
- `src/services/{dashboard,api,search}Service.ts`
- `src/pages/Dashboard/` + `components/*`
- `src/pages/Settings/ApiManagementPage.tsx`、`ApiTableRow.tsx`
- `src/pages/Error/ErrorPage.tsx`
- `src/components/common/{GlobalSearch,CopyInput,PageSkeleton,VirtualList,LazyImage,emptyPresets}*`
- `src/components/workflow/PublishApiModal.tsx`
- `src/hooks/{useOnlineStatus,useResponsiveSidebar}.ts`
- `src/utils/canvasPerformance.ts`

## 关联文档

- [Phase 6](../phase6/开发文档.md) · [Phase 5](../phase5/开发文档.md) · [Phase 0](../phase0/开发文档.md)
- [设计系统规范](../汤圆的代码助手_设计系统规范.md)
