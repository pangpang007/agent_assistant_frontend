# Phase 1 — 用户系统

> 状态：**已完成**

实现注册、登录、登出、个人资料、团队管理与 JWT 鉴权体系。

## 文档

| 文档 | 用途 |
|------|------|
| [开发文档.md](./开发文档.md) | 完整规格：路由、鉴权、页面、API、组件 |
| [实施计划.md](./实施计划.md) | 分步实施与验收清单 |

## 已实现功能

- `/login`、`/register` 全屏认证页
- `AuthGuard` / `AuthRouteGuard` 路由守卫
- Zustand `authStore` + Token 自动刷新
- 个人资料页（`/settings/profile`）
- 团队管理页（`/settings/team`）
- TopNav 用户菜单与登出

## 关联文档

- [设计系统规范](../汤圆的代码助手_设计系统规范.md)
- [Phase 0 开发文档](../phase0/开发文档.md)
