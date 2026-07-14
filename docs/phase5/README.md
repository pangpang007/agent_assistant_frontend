# Phase 5 — 执行引擎前端

> 状态：**已完成**

工作流执行引擎前端：运行配置、WebSocket 实时状态、执行面板、审核交互、画布状态同步。

## 文档

| 文档 | 用途 |
|------|------|
| [开发文档.md](./开发文档.md) | 完整规格：WebSocket 协议、执行面板、API、状态机 |
| [实施计划.md](./实施计划.md) | 分步实施与验收清单 |

## 已实现功能

- 工具栏「运行 / 停止」与 `RunConfigModal` / `StopConfirmModal`
- `executionStore` + `executionService`（启动 / 停止 / 审核 / 日志）
- `useExecutionWebSocket`（心跳、指数退避重连）+ 消息分发
- `ExecutionPanel`：进度、节点状态、统计、日志流、完成/失败视图
- 审核节点：通过 / 驳回 / 修改后通过（REST + WebSocket 双通道）
- 画布节点状态动画 + `ExecutionEdge` 执行连线高亮
- 执行中锁定右侧面板与画布编辑

## 关键路径

- `src/types/execution.ts`
- `src/stores/executionStore.ts`
- `src/services/executionService.ts`
- `src/hooks/useExecutionWebSocket.ts` / `useExecutionMessageHandler.ts` / `useExecutionTimer.ts`
- `src/components/workflow/execution/*`
- `src/components/workflow/RightPanelContainer.tsx`
- `src/styles/execution-animations.css`

## 关联文档

- [设计系统规范](../汤圆的代码助手_设计系统规范.md)
- [Phase 4 开发文档](../phase4/开发文档.md)
