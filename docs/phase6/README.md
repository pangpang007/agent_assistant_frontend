# Phase 6 — 模板 + 版本 + 历史 + 环境变量

> 状态：**已完成**

在 Phase 4/5 编辑器与执行引擎之上，补全运营管理能力：模板库、版本侧边栏、执行历史、日志中心、环境变量。

## 文档

| 文档 | 用途 |
|------|------|
| [开发文档.md](./开发文档.md) | 完整规格：路由、页面、API、Store |
| [实施计划.md](./实施计划.md) | 分步实施与验收清单 |

## 已实现功能

- `/templates` 模板库：分类/来源筛选、使用模板创建工作流、另存为模板
- 编辑器版本侧边栏：列表、标签、预览回滚、版本对比（API + 本地 `computeVersionDiff`）
- `/executions` 执行历史列表与 `/executions/:id` 详情（只读画布 + 时间线 + 节点详情）
- `/logs` 日志中心：级别/关键词筛选与详情抽屉
- `/settings/env` 环境变量 CRUD（Secret 脱敏 + 传输加密）
- 侧边栏菜单：模板库、执行历史；旧路径 `workflows/templates|history` 重定向

## 关键路径

- `src/types/phase6.ts`
- `src/services/{template,version,log,env}Service.ts` + `executionService` 历史 API
- `src/stores/{template,executionHistory,log,envVar}Store.ts`
- `src/pages/Templates|Executions|Logs`、`src/components/env`、`VersionSidebar*`
- `src/lib/workflow/versionDiff.ts`

## 关联文档

- [Phase 4](../phase4/开发文档.md) · [Phase 5](../phase5/开发文档.md)
- [设计系统规范](../汤圆的代码助手_设计系统规范.md)
