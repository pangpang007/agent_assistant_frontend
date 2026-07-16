---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 4263223131904378_0-data_volume/7650412177643372840-files/所有对话/主对话/supplement_auth_cookie_frontend.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 4263223131904378#1784180839225
    ReservedCode2: ""
---
# 产品描述文档：前端认证方案迁移 — localStorage Token → HttpOnly Cookie

> **文档类型**：前端产品描述文档（供 Cursor 编写代码使用）
> **产品名称**：汤圆的代码助手
> **涉及模块**：认证 / 鉴权 / 会话管理
> **优先级**：P0（安全 + 体验）
> **预计改动文件数**：7 个核心文件
> **预计代码行数**：800–1200 行文档，实际改动约 200–350 行代码

---

## 一、目标

### 1.1 核心目标

将前端认证方案从 **localStorage 手动存储 JWT + Axios 拦截器手动附加 Authorization Header** 迁移为 **HttpOnly Cookie 自动管理 + 后端自动续期**，从而实现：

| 维度 | 迁移前（localStorage） | 迁移后（HttpOnly Cookie） |
|------|----------------------|--------------------------|
| Token 存储位置 | `localStorage`（JS 可读写） | HttpOnly Cookie（JS 不可读） |
| Token 传输方式 | Axios 拦截器手动加 Header | 浏览器自动携带 Cookie |
| Token 续期方式 | 前端检测过期 → 手动刷新 → 重新存 localStorage | 后端自动续期 → Set-Cookie 覆盖旧 Cookie |
| XSS 攻击面 | 攻击者可窃取 token | token 对 JS 不可见，无法窃取 |
| 过期体验 | 用户被强制登出，丢失操作上下文 | 后端自动续期，用户无感知 |
| 前端代码复杂度 | 需要管理 token 生命周期 | 前端完全不感知 token |

### 1.2 具体目标

1. **安全提升**：Token 不再暴露给前端 JavaScript，消除 XSS 窃取 token 的攻击面
2. **体验提升**：用户不再因 token 过期被强制登出，后端自动续期，前端可选提示
3. **代码简化**：前端移除所有 token 管理逻辑，减少维护成本
4. **向后兼容**：迁移过程需确保已登录用户不会突然掉线（优雅降级）

---

## 二、技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vite | ^5.x | 构建工具 |
| React | ^18.x | UI 框架 |
| TypeScript | ^5.x | 类型安全 |
| Zustand | ^4.x / ^5.x | 状态管理 |
| Axios | ^1.x | HTTP 客户端 |
| Ant Design | ^5.x | UI 组件库（message 组件用于 toast） |

---

## 三、改动清单总览

| 序号 | 文件路径 | 改动类型 | 改动概述 |
|------|---------|---------|---------|
| 1 | `src/lib/axios.ts` | **重写** | 启用 `withCredentials`，移除 Authorization header 逻辑，改造响应拦截器 |
| 2 | `src/stores/authStore.ts` | **重写** | 移除所有 token 状态，改造 login/logout/fetchProfile/checkAuth |
| 3 | `src/components/ProtectedRoute.tsx` | **改造** | 移除 localStorage 读取，改用 authStore.checkAuth() |
| 4 | `src/pages/Auth/LoginPage.tsx` | **改造** | 移除 localStorage 存储逻辑，简化登录流程 |
| 5 | `src/pages/Auth/RegisterPage.tsx` | **改造** | 移除 localStorage 存储逻辑，简化注册流程 |
| 6 | `src/App.tsx` | **改造** | 移除 localStorage 恢复 token，改用 checkAuth() |
| 7 | `.env` / `.env.example` | **改造** | 移除 `VITE_TOKEN_KEY` 等 token 相关变量 |

---

## 四、各文件详细改动描述

---

### 4.1 `src/lib/axios.ts` — Axios 客户端改造

#### 4.1.1 改动概述

此文件是全局 HTTP 客户端的创建和配置中心。核心改动：

- **新增**：`withCredentials: true` — 让浏览器自动携带 Cookie（包括 HttpOnly Cookie）
- **移除**：请求拦截器中从 localStorage 读取 token 并设置 `Authorization: Bearer xxx` 的逻辑
- **改造**：响应拦截器 — 移除 token 刷新逻辑，新增 401 处理 + 续期检测

#### 4.1.2 改造前代码模式（需移除）

```ts
// ❌ 改造前 — 需要移除的逻辑

// 请求拦截器：手动附加 Authorization header
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');  // ❌ 移除
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // ❌ 移除
  }
  return config;
});

// 响应拦截器：手动处理 token 刷新
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        // 尝试用 refresh_token 刷新
        const res = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
        localStorage.setItem('access_token', res.data.access_token);  // ❌ 移除
        // 重试原请求...
      } else {
        localStorage.removeItem('access_token');  // ❌ 移除
        localStorage.removeItem('refresh_token');  // ❌ 移除
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

#### 4.1.3 改造后完整代码

```ts
// src/lib/axios.ts
import axios from 'axios';
import { message } from 'antd';

// ============================================================
// Axios 实例创建
// ============================================================
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,  // ✅ 关键：自动携带 Cookie（含 HttpOnly）
  timeout: 30_000,        // 30 秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// 请求拦截器
// ============================================================
// 注意：不再需要从 localStorage 读取 token 并设置 Authorization header
// 浏览器会自动携带 Cookie，后端通过 Cookie 中的 token 鉴权
// ============================================================

http.interceptors.request.use(
  (config) => {
    // 可选：添加请求时间戳用于调试
    // config.headers['X-Request-Time'] = Date.now().toString();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// 响应拦截器
// ============================================================
// 职责：
// 1. 检测后端自动续期信号（X-Token-Refreshed 响应头）
// 2. 处理 401 未授权 → 清除认证状态 → 跳转登录页
// 3. 处理网络错误和其他异常
// ============================================================

// 防止多个 401 同时触发重复跳转
let isRedirectingToLogin = false;

http.interceptors.response.use(
  (response) => {
    // ✅ 检测后端是否自动续期了 token
    // 后端在 token 即将过期时，会自动续期并通过 Set-Cookie 返回新 token
    // 同时附带 X-Token-Refreshed: true 响应头通知前端
    const tokenRefreshed = response.headers['x-token-refreshed'];
    if (tokenRefreshed === 'true') {
      // 方案 B（可选增强）：显示 toast 提示
      // 默认静默模式，如需启用，取消下方注释：
      // message.success({
      //   content: '会话已自动续期',
      //   duration: 2,
      //   key: 'token-refreshed',  // 使用 key 防止重复显示
      // });
      
      // 开发环境可选：在控制台打印续期信息（生产环境静默）
      if (import.meta.env.DEV) {
        console.debug('[Auth] Token 已自动续期');
      }
    }
    
    return response;
  },
  async (error) => {
    // ---- 401 未授权处理 ----
    if (error.response?.status === 401) {
      // 防止并发请求导致多次跳转
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        
        // 清除前端认证状态
        // 注意：不能在这里直接 import authStore 使用（可能导致循环依赖）
        // 通过自定义事件通知 authStore 清除状态
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        
        // 获取当前路径，用于登录后回跳
        const currentPath = window.location.pathname;
        const redirectUrl = currentPath !== '/' && currentPath !== '/login'
          ? `/login?redirect=${encodeURIComponent(currentPath)}`
          : '/login';
        
        // 跳转登录页
        window.location.href = redirectUrl;
        
        // 重置标记（延迟，确保跳转完成）
        setTimeout(() => {
          isRedirectingToLogin = false;
        }, 3000);
      }
      
      return Promise.reject(error);
    }
    
    // ---- 网络错误处理 ----
    if (!error.response) {
      // 网络断开、DNS 解析失败、CORS 错误等
      message.error({
        content: '网络连接异常，请检查网络后重试',
        key: 'network-error',
      });
      return Promise.reject(error);
    }
    
    // ---- 其他 HTTP 错误 ----
    const status = error.response.status;
    
    if (status === 403) {
      message.error({
        content: '没有权限执行此操作',
        key: 'forbidden-error',
      });
    } else if (status === 500 || status === 502 || status === 503) {
      message.error({
        content: '服务器异常，请稍后重试',
        key: 'server-error',
      });
    }
    
    return Promise.reject(error);
  }
);

export default http;
```

#### 4.1.4 关键设计决策说明

| 决策 | 选择 | 原因 |
|------|------|------|
| `withCredentials` | 设为 `true` | 浏览器会自动携带同域 Cookie，包括 HttpOnly Cookie |
| 401 防重复跳转 | `isRedirectingToLogin` 标记 | 页面加载时可能并发多个请求，避免多次触发跳转 |
| 通知 authStore | `CustomEvent` 而非直接 import | 避免 axios.ts 与 authStore 的循环依赖 |
| 续期 toast | 默认静默，DEV 模式 console.debug | 续期是正常行为，不应打扰用户；开发时可观察 |
| 网络错误 | `message.error` 提示 | 网络问题需要用户感知 |

---

### 4.2 `src/stores/authStore.ts` — Auth Store (Zustand) 改造

#### 4.2.1 改动概述

Auth Store 是前端认证状态的核心。核心改动：

- **移除**：所有 token 相关状态（`token`、`accessToken`、`setToken`、`getAccessToken` 等）
- **改造**：`isAuthenticated` 的判断逻辑 — 从检查 token 是否存在改为检查 `user` 是否不为 null
- **新增**：`fetchProfile()` 方法 — 从后端获取当前用户信息（依赖 Cookie 鉴权）
- **新增**：`checkAuth()` 方法 — 应用启动时检查是否已登录
- **改造**：`login()` / `logout()` 流程 — 移除手动 token 管理步骤

#### 4.2.2 改造前 vs 改造后对比

```ts
// ❌ 改造前
interface AuthState {
  token: string | null;           // ❌ 移除
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setToken: (token: string) => void;  // ❌ 移除
  clearToken: () => void;             // ❌ 移除
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

// ✅ 改造后
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;  // ✅ 新增：标记是否已完成初始化检查
  
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  reset: () => void;  // ✅ 新增：重置所有状态
}
```

#### 4.2.3 改造后完整代码

```ts
// src/stores/authStore.ts
import { create } from 'zustand';
import http from '@/lib/axios';
import { message } from 'antd';

// ============================================================
// 类型定义
// ============================================================

export interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
  // ... 根据实际后端返回的 user 字段扩展
}

export interface RegisterData {
  email: string;
  password: string;
  nickname?: string;
  // ... 根据实际注册表单字段扩展
}

interface AuthState {
  // ---- 状态 ----
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;  // 应用初始化检查是否完成

  // ---- Actions ----
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  reset: () => void;
}

// ============================================================
// Store 定义
// ============================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  // ---- 初始状态 ----
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,

  // ========================================================
  // login: 用户登录
  // ========================================================
  // 流程：
  //   1. POST /api/auth/login { email, password }
  //   2. 后端验证通过 → Set-Cookie（HttpOnly）设置 token
  //   3. 前端调用 fetchProfile() 获取用户信息
  //   4. 设置 user + isAuthenticated = true
  //   5. 跳转首页
  //
  // 注意：前端不需要处理 token！后端通过 Set-Cookie 自动管理
  // ========================================================
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Step 1: 发送登录请求
      // 后端会通过 Set-Cookie 设置 HttpOnly Cookie
      await http.post('/api/auth/login', { email, password });

      // Step 2: 获取用户信息（此时 Cookie 已生效）
      await get().fetchProfile();

      // Step 3: 登录成功提示
      message.success({
        content: '登录成功',
        key: 'login-success',
      });
    } catch (error: unknown) {
      // 登录失败不改变认证状态
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err?.response?.data?.message || '登录失败，请检查邮箱和密码';
      message.error({
        content: errorMessage,
        key: 'login-error',
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // ========================================================
  // register: 用户注册
  // ========================================================
  // 流程：
  //   1. POST /api/auth/register { email, password, nickname? }
  //   2. 后端创建用户 → Set-Cookie 自动登录
  //   3. 前端调用 fetchProfile() 获取用户信息
  //   4. 跳转首页
  // ========================================================
  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      // 后端注册成功后会自动 Set-Cookie
      await http.post('/api/auth/register', data);

      // 获取用户信息
      await get().fetchProfile();

      message.success({
        content: '注册成功',
        key: 'register-success',
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err?.response?.data?.message || '注册失败，请稍后重试';
      message.error({
        content: errorMessage,
        key: 'register-error',
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // ========================================================
  // logout: 用户登出
  // ========================================================
  // 流程：
  //   1. POST /api/auth/logout → 后端清除 Cookie
  //   2. 清除前端状态（user = null, isAuthenticated = false）
  //   3. 跳转 /login
  //
  // 注意：即使 POST /api/auth/logout 失败，也要清除本地状态
  // ========================================================
  logout: async () => {
    try {
      // 通知后端清除 Cookie
      await http.post('/api/auth/logout');
    } catch {
      // 登出接口失败也要继续清除本地状态
      // 可能原因：网络断开、token 已过期等
      console.warn('[Auth] 登出接口调用失败，仍然清除本地状态');
    } finally {
      // 无论接口是否成功，都清除前端状态
      set({
        user: null,
        isAuthenticated: false,
        initialized: true,  // 保持 initialized，避免重复检查
      });

      message.info({
        content: '已退出登录',
        key: 'logout-info',
      });

      // 跳转登录页
      window.location.href = '/login';
    }
  },

  // ========================================================
  // fetchProfile: 获取当前用户信息
  // ========================================================
  // 依赖 Cookie 鉴权（浏览器自动携带 HttpOnly Cookie）
  // 如果 Cookie 有效 → 返回用户信息
  // 如果 Cookie 无效 → 后端返回 401，由 axios 拦截器处理
  // ========================================================
  fetchProfile: async () => {
    try {
      const response = await http.get<{ user: User }>('/api/users/profile');
      const user = response.data.user;
      set({
        user,
        isAuthenticated: true,
        initialized: true,
      });
    } catch (error) {
      // 401 由 axios 拦截器统一处理（清除状态 + 跳转登录页）
      // 这里只需要确保状态一致
      set({
        user: null,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  // ========================================================
  // checkAuth: 检查是否已登录（应用启动时调用）
  // ========================================================
  // 调用 /api/users/profile：
  //   - 成功（200） → Cookie 有效 → 设置用户信息 → 返回 true
  //   - 失败（401） → Cookie 无效/过期 → 保持未登录 → 返回 false
  //
  // 这个方法不抛异常，调用方根据返回值决定后续行为
  // ========================================================
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await http.get<{ user: User }>('/api/users/profile');
      const user = response.data.user;
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        initialized: true,
      });
      return true;
    } catch {
      // Cookie 无效或过期
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initialized: true,
      });
      return false;
    }
  },

  // ========================================================
  // reset: 重置所有状态
  // ========================================================
  // 用于：
  //   - 收到 401 时由 auth:unauthorized 事件触发
  //   - 需要强制清除所有认证状态的场景
  // ========================================================
  reset: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: true,
    });
  },
}));

// ============================================================
// 监听 auth:unauthorized 事件
// ============================================================
// 当 axios 拦截器检测到 401 时，会派发此事件
// 这里监听并清除 authStore 状态
// ============================================================
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().reset();
  });
}
```

#### 2.4 关键设计决策说明

| 决策 | 选择 | 原因 |
|------|------|------|
| `isAuthenticated` 判断 | `user !== null` | 不再依赖 token 是否存在，而是看是否有用户信息 |
| `initialized` 标记 | 新增字段 | 区分"正在检查"和"检查完成"两种状态，避免闪烁 |
| `logout` 失败处理 | 仍然清除本地状态 | 网络断开时也要允许用户退出 |
| `checkAuth` 返回值 | `boolean` | 调用方需要知道检查结果来决定路由行为 |
| `auth:unauthorized` 事件 | CustomEvent 解耦 | 避免 axios.ts 和 authStore.ts 循环依赖 |
| `reset` 方法 | 独立方法 | 统一清除逻辑，多处复用 |

---

### 4.3 `src/components/ProtectedRoute.tsx` — 路由守卫改造

#### 4.3.1 改动概述

路由守卫负责保护需要登录才能访问的页面。核心改动：

- **移除**：从 localStorage 读取 token 判断是否已登录的逻辑
- **改造**：改为依赖 `authStore.isAuthenticated` + `authStore.checkAuth()`
- **新增**：处理初始化中的 loading 状态（避免闪烁）

#### 4.3.2 改造前代码模式（需移除）

```tsx
// ❌ 改造前 — 需要移除的逻辑
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');  // ❌ 移除
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
```

#### 4.3.3 改造后完整代码

```tsx
// src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 路由守卫组件
 *
 * 逻辑：
 * 1. 如果 authStore 已标记为已登录（isAuthenticated === true）→ 直接放行
 * 2. 如果尚未初始化（initialized === false）→ 调用 checkAuth() 检查 Cookie
 * 3. checkAuth() 成功 → 放行
 * 4. checkAuth() 失败（401）→ 重定向到 /login
 *
 * 注意：
 * - 不再从 localStorage 读取 token
 * - Cookie 由浏览器自动携带，后端通过 Cookie 判断是否已登录
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, initialized, checkAuth } = useAuthStore();
  const [checkCompleted, setCheckCompleted] = useState(initialized);

  useEffect(() => {
    let cancelled = false;

    // 如果已经初始化过了，不需要再检查
    if (initialized) {
      setCheckCompleted(true);
      return;
    }

    // 执行认证检查
    checkAuth().finally(() => {
      if (!cancelled) {
        setCheckCompleted(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialized, checkAuth]);

  // 正在检查认证状态 → 显示 loading（避免页面闪烁）
  if (!checkCompleted || isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}>
        <Spin size="large" tip="正在验证登录状态..." />
      </div>
    );
  }

  // 认证检查完成，未登录 → 重定向到登录页
  if (!isAuthenticated) {
    // 保留当前路径，登录后可回跳
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // 已登录 → 放行
  return <>{children}</>;
};

export default ProtectedRoute;
```

#### 4.3.4 关键设计决策说明

| 决策 | 选择 | 原因 |
|------|------|------|
| 初始化 loading | `<Spin>` 全屏 | 避免未登录时短暂闪现子页面内容 |
| `checkCompleted` 本地状态 | useState 管理 | 与 authStore 的 `initialized` 配合，确保只检查一次 |
| redirect 参数 | URL encode 路径 | 登录后可以回跳到用户原本想访问的页面 |
| `cancelled` 标记 | 防止竞态 | 组件卸载后不再更新状态 |

---

### 4.4 `src/pages/Auth/LoginPage.tsx` — 登录页改造

#### 4.4.1 改动概述

- **移除**：登录成功后将 token 存入 localStorage 的代码
- **移除**：页面加载时从 localStorage 读取 token 判断是否已登录的代码
- **改造**：登录成功后直接依赖 authStore.login() 完成所有流程

#### 4.4.2 改造后完整代码

```tsx
// src/pages/Auth/LoginPage.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Form, Input, Button, Typography } from 'antd';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

/**
 * 登录页面
 *
 * 改造要点：
 * 1. 不再手动存储 token 到 localStorage
 * 2. 不再从 localStorage 读取 token 判断是否已登录
 * 3. 登录成功后直接调用 authStore.login()，后端 Set-Cookie
 * 4. 登录成功后根据 redirect 参数跳转，或默认跳转首页
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, isAuthenticated } = useAuthStore();

  // 如果已登录，直接跳转首页（或 redirect 页面）
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      
      // 登录成功后跳转
      // authStore.login() 成功后会自动设置 isAuthenticated = true
      // 上面的 useEffect 会处理跳转
      // 但如果 useEffect 还没来得及执行，这里也做一次兜底
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect, { replace: true });
    } catch {
      // 错误提示已在 authStore.login() 中处理
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f5f5f5',
    }}>
      <div style={{
        width: 400,
        padding: 32,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          登录
        </Title>

        <Form
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="your@email.com" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password placeholder="请输入密码" size="large" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isLoading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            还没有账号？{' '}
            <Link to="/register">立即注册</Link>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

---

### 4.5 `src/pages/Auth/RegisterPage.tsx` — 注册页改造

#### 4.5.1 改动概述

与 LoginPage 类似的改造：

- **移除**：注册成功后将 token 存入 localStorage 的代码
- **改造**：注册成功后调用 authStore.register()，后端自动 Set-Cookie

#### 4.5.2 改造后完整代码

```tsx
// src/pages/Auth/RegisterPage.tsx
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import type { RegisterData } from '@/stores/authStore';

const { Title, Text } = Typography;

/**
 * 注册页面
 *
 * 改造要点：
 * 1. 不再手动存储 token 到 localStorage
 * 2. 注册成功后调用 authStore.register()，后端自动 Set-Cookie + 登录
 */
export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, isAuthenticated } = useAuthStore();

  // 如果已登录（注册成功后自动登录），跳转首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (values: RegisterData) => {
    try {
      await register(values);
      // 注册成功后自动登录，useEffect 会处理跳转
      navigate('/', { replace: true });
    } catch {
      // 错误提示已在 authStore.register() 中处理
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f5f5f5',
    }}>
      <div style={{
        width: 400,
        padding: 32,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          注册
        </Title>

        <Form
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="your@email.com" size="large" />
          </Form.Item>

          <Form.Item
            name="nickname"
            label="昵称"
            rules={[
              { required: true, message: '请输入昵称' },
              { max: 20, message: '昵称最多 20 个字符' },
            ]}
          >
            <Input placeholder="你的昵称" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password placeholder="请输入密码" size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" size="large" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isLoading}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            已有账号？{' '}
            <Link to="/login">立即登录</Link>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
```

---

### 4.6 `src/App.tsx` — 应用初始化改造

#### 4.6.1 改动概述

应用启动时的认证初始化是迁移的重点之一。核心改动：

- **移除**：从 localStorage 恢复 token 的逻辑
- **改造**：启动时直接调用 `authStore.checkAuth()`，让浏览器自动携带 Cookie 检查登录状态
- **新增**：处理初始化 loading 状态，避免路由闪烁

#### 4.6.2 改造前代码模式（需移除）

```tsx
// ❌ 改造前 — 需要移除的逻辑
function App() {
  useEffect(() => {
    // 从 localStorage 恢复 token
    const token = localStorage.getItem('access_token');
    if (token) {
      setAuthToken(token);  // ❌ 移除
      fetchProfile();       // 带 Authorization header
    }
  }, []);
}
```

#### 4.6.3 改造后完整代码

```tsx
// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin, ConfigProvider } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/Auth/LoginPage';
import { RegisterPage } from '@/pages/Auth/RegisterPage';
// ... 导入其他页面组件

/**
 * 应用根组件
 *
 * 初始化流程：
 * 1. 应用启动 → 调用 authStore.checkAuth()
 * 2. checkAuth() → GET /api/users/profile（浏览器自动携带 Cookie）
 * 3. 如果 Cookie 有效 → 后端返回用户信息 → 已登录状态
 * 4. 如果 Cookie 无效/过期 → 后端返回 401 → 未登录状态
 *
 * 注意：
 * - 不再从 localStorage 恢复 token
 * - 后端会自动续期即将过期的 Cookie（Set-Cookie）
 * - 用户关闭浏览器后重新打开，只要 Cookie 未过期就仍然有效
 */
function App() {
  const { initialized, checkAuth } = useAuthStore();

  useEffect(() => {
    // 应用启动时检查认证状态
    // checkAuth 内部会调用 GET /api/users/profile
    // 浏览器会自动携带 HttpOnly Cookie
    checkAuth();
  }, [checkAuth]);

  // 认证检查未完成 → 显示全屏 loading
  // 避免：先显示登录页，再突然跳转到首页的闪烁问题
  if (!initialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5',
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 受保护路由 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {/* 首页组件 */}
                <div>首页</div>
              </ProtectedRoute>
            }
          />

          {/* ... 其他受保护路由 */}

          {/* 未匹配路由 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
```

---

### 4.7 `.env` / `.env.example` — 环境变量改造

#### 4.7.1 改动概述

- **移除**：`VITE_TOKEN_KEY`、`VITE_REFRESH_TOKEN_KEY` 等 token 相关的环境变量
- **保留**：`VITE_API_BASE_URL`

#### 4.7.2 改造后

```env
# .env.example

# API 基础地址
VITE_API_BASE_URL=https://api.soupcircle.xyz

# ❌ 已移除以下变量（不再需要）：
# VITE_TOKEN_KEY=access_token
# VITE_REFRESH_TOKEN_KEY=refresh_token
```

---

## 五、自动续期方案

### 5.1 方案 A：完全被动（✅ 推荐）

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  前端     │         │  后端     │         │  浏览器   │
│          │         │          │         │ (Cookie)  │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │  GET /api/xxx      │                    │
     │ (自动携带Cookie) ──┼──────────────────→ │
     │                    │                    │
     │                    │  检测 token 即将    │
     │                    │  过期（如剩余<5min） │
     │                    │                    │
     │                    │  生成新 token       │
     │                    │                    │
     │  200 OK            │                    │
     │  Set-Cookie: new   │                    │
     │ ←──────────────────┼────────────────────│
     │  X-Token-Refreshed │                    │
     │  : true            │                    │
     │                    │                    │
     │  浏览器自动更新     │                    │
     │  Cookie ←───────────────────────────────│
     │                    │                    │
```

**前端代码**：不需要任何额外代码。后端自动处理续期，浏览器自动更新 Cookie。

**优点**：
- 前端零改动、零复杂度
- 不会触发额外的网络请求
- 完全依赖 HTTP 标准机制

**缺点**：
- 前端无法主动知道 token 是否续期了（但也不需要知道）
- 如果用户长时间不操作（没有任何请求），token 最终会过期

### 5.2 方案 B：定时轮询（可选增强）

```
┌──────────┐                          ┌──────────┐
│  前端     │                          │  后端     │
│          │                          │          │
└────┬─────┘                          └────┬─────┘
     │                                     │
     │  每 5 分钟                          │
     │  GET /api/auth/token-status         │
     │ ──────────────────────────────────→ │
     │                                     │
     │  200 OK                             │
     │  {                                  │
     │    valid: true,                     │
     │    expiresInSeconds: 280,           │
     │    renewed: false                   │
     │  }                                  │
     │ ←────────────────────────────────── │
     │                                     │
     │  如果 renewed: true → toast "已续期" │
     │  如果 expiresInSeconds < 60         │
     │    → toast "会话即将过期"            │
     │  如果 valid: false                  │
     │    → 跳转登录页                      │
     │                                     │
```

**前端实现（如需启用）**：

```ts
// src/hooks/useTokenStatus.ts（可选增强，方案 B）
import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import http from '@/lib/axios';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 分钟

interface TokenStatus {
  valid: boolean;
  expiresInSeconds: number;
  renewed: boolean;
}

export function useTokenStatus(enabled: boolean = false) {
  const { isAuthenticated } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // 仅在启用且已登录时轮询
    if (!enabled || !isAuthenticated) return;

    const checkTokenStatus = async () => {
      try {
        const response = await http.get<TokenStatus>('/api/auth/token-status');
        const { valid, expiresInSeconds, renewed } = response.data;

        if (!valid) {
          // Token 无效，跳转登录
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          window.location.href = '/login';
          return;
        }

        if (renewed) {
          message.success({
            content: '会话已自动续期',
            duration: 2,
            key: 'token-status-renewed',
          });
        }

        if (expiresInSeconds < 60) {
          message.warning({
            content: '会话即将过期，请保存您的工作',
            duration: 5,
            key: 'token-status-expiring',
          });
        }
      } catch {
        // 静默处理，不干扰用户操作
      }
    };

    // 立即检查一次
    checkTokenStatus();

    // 定时轮询
    timerRef.current = setInterval(checkTokenStatus, POLL_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, isAuthenticated]);
}
```

**在 App.tsx 中使用**：

```tsx
// src/App.tsx 中添加（可选）
function App() {
  // ... 其他代码

  // 启用方案 B（默认关闭，设为 true 开启）
  useTokenStatus(false);  // false = 不启用，true = 启用

  // ...
}
```

### 5.3 方案对比与推荐

| 维度 | 方案 A（被动） | 方案 B（轮询） |
|------|-------------|-------------|
| 复杂度 | 零 | 低 |
| 额外请求 | 无 | 每 5 分钟 1 次 |
| 用户感知 | 完全无感知 | 可选提示 |
| 长会话保护 | 依赖用户操作触发续期 | 即使无操作也能续期 |
| 推荐场景 | 大多数场景 | 需要长会话保活的场景 |
| **推荐** | ✅ **推荐** | 可选 |

---

## 六、401 处理流程详解

### 6.1 流程图

```
                    任意 API 请求
                         │
                         ▼
                  收到 401 响应？
                    ╱        ╲
                  是           否
                  │            │
                  ▼            ▼
          isRedirecting?    正常处理
           ╱       ╲
         是          否
         │            │
         ▼            ▼
      忽略        设置标记
                  派发事件
                  清除状态
                  跳转登录
```

### 6.2 处理逻辑

1. **Axios 响应拦截器**检测到 401
2. 检查 `isRedirectingToLogin` 标记，防止并发 401 重复处理
3. 派发 `auth:unauthorized` 自定义事件
4. `authStore` 监听到事件，调用 `reset()` 清除状态
5. 计算 redirect URL（保留当前路径用于登录后回跳）
6. 通过 `window.location.href` 跳转到登录页

### 6.3 为什么用 `window.location.href` 而非 `navigate()`？

- Axios 拦截器在 React 组件树之外运行，无法直接使用 `react-router` 的 `navigate`
- `window.location.href` 会导致页面刷新，但此时需要清除所有前端状态，刷新是安全的
- 登录后 `LoginPage` 会从 URL 参数读取 redirect 并跳转回原页面

---

## 七、安全注意事项

### 7.1 HttpOnly Cookie 安全模型

```
┌─────────────────────────────────────────────────────────┐
│                    浏览器安全模型                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  JavaScript (包括恶意脚本)                                │
│  ┌─────────────────────────────────────────────┐        │
│  │  document.cookie → 看不到 HttpOnly Cookie    │  ✅    │
│  │  localStorage   → 没有任何 token 数据        │  ✅    │
│  │  fetch/XHR     → 自动携带 Cookie             │  ✅    │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  攻击场景分析：                                          │
│  ┌─────────────────────────────────────────────┐        │
│  │  XSS 攻击 → 无法窃取 token                  │  ✅    │
│  │  CSRF 攻击 → SameSite=Lax 防护              │  ✅    │
│  │  中间人攻击 → HTTPS 加密防护                 │  ✅    │
│  └─────────────────────────────────────────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 安全清单

| 安全措施 | 责任方 | 说明 |
|---------|-------|------|
| HttpOnly | 后端 Set-Cookie | JS 无法读取 Cookie，防止 XSS 窃取 |
| Secure | 后端 Set-Cookie | 仅 HTTPS 传输，防止中间人截获 |
| SameSite=Lax | 后端 Set-Cookie | 防止 CSRF 攻击，前端无需额外处理 |
| Path=/ | 后端 Set-Cookie | Cookie 对所有路径有效 |
| HTTPS | 部署配置 | 生产环境必须使用 HTTPS |
| CORS credentials | 后端配置 | `allow_credentials=True` + 明确指定 origin |

### 7.3 前端安全收益

**迁移前（localStorage）**：
```
XSS 攻击 → 执行 document.cookie / localStorage.getItem('token')
         → 获取到 token
         → 发送到攻击者服务器
         → 攻击者冒充用户 ❌
```

**迁移后（HttpOnly Cookie）**：
```
XSS 攻击 → 执行 document.cookie → 看不到 token
         → 执行 localStorage.getItem('token') → null
         → 攻击者无法获取 token ✅
         → 但攻击者仍可利用用户身份发起请求（CSRF）
         → SameSite=Lax 阻止跨站请求携带 Cookie ✅
```

---

## 八、与 Phase 0-7 的衔接

### 8.1 迁移步骤（推荐顺序）

> ⚠️ **重要**：必须**先改后端，再改前端**。否则前端不再发送 Authorization header，但后端仍期望 header，会导致所有接口 401。

```
Phase -1: 后端改造（前置条件）
  ├── 后端实现 Cookie 鉴权中间件（同时兼容 Authorization header，过渡期）
  ├── 后端 login/register 接口添加 Set-Cookie 响应
  ├── 后端 logout 接口添加清除 Cookie 逻辑
  ├── 后端实现自动续期逻辑
  └── 后端配置 CORS（allow_credentials=True）

Phase 0: 前端改造（本文档）
  ├── Step 1: 改造 axios.ts（withCredentials + 拦截器）
  ├── Step 2: 改造 authStore.ts（移除 token，添加 checkAuth/fetchProfile）
  ├── Step 3: 改造 ProtectedRoute.tsx
  ├── Step 4: 改造 LoginPage.tsx
  ├── Step 5: 改造 RegisterPage.tsx
  ├── Step 6: 改造 App.tsx
  └── Step 7: 清理 .env

Phase 1: 后端移除兼容
  └── 后端移除 Authorization header 兼容逻辑（确认前端完全迁移后）
```

### 8.2 过渡期兼容策略

在后端过渡期间（Phase -1 到 Phase 0 之间），后端应**同时支持**两种鉴权方式：

```python
# 后端伪代码 — 过渡期双模式鉴权
async def get_current_user(request):
    # 方式 1: Cookie 鉴权（新方式，优先）
    token = request.cookies.get('access_token')
    
    # 方式 2: Authorization header 鉴权（旧方式，兜底）
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401)
    
    return decode_token(token)
```

### 8.3 各文件改动与 Phase 依赖

| 文件 | 依赖的 Phase | 被依赖的 Phase |
|------|-------------|---------------|
| `src/lib/axios.ts` | 后端 Cookie 中间件 | 所有使用 http 的文件 |
| `src/stores/authStore.ts` | axios.ts | ProtectedRoute, LoginPage, RegisterPage, App.tsx |
| `src/components/ProtectedRoute.tsx` | authStore | 路由配置 |
| `src/pages/Auth/LoginPage.tsx` | authStore | — |
| `src/pages/Auth/RegisterPage.tsx` | authStore | — |
| `src/App.tsx` | authStore, ProtectedRoute | — |
| `.env` | 无 | axios.ts |

---

## 九、Cursor 额外说明

### 9.1 迁移步骤指引

**给 Cursor 的执行顺序**：

1. **先确认后端已支持 Cookie 鉴权**（检查后端 login 接口响应是否包含 `Set-Cookie`）
2. 按以下顺序修改前端文件：
   - `src/lib/axios.ts` → `src/stores/authStore.ts` → 其余文件
   - 原因：axios.ts 是基础设施，authStore 依赖它，其他组件依赖 authStore
3. 每个文件改完后运行 TypeScript 类型检查：`npx tsc --noEmit`
4. 全部改完后进行集成测试

### 9.2 本地开发 Cookie 行为

**localhost 开发时需注意**：

| 行为 | 说明 |
|------|------|
| HttpOnly 在 localhost 有效 | 浏览器在 localhost 上支持 HttpOnly Cookie |
| Secure 标志在 localhost 无效 | localhost 是 HTTP，`Secure` 标志的 Cookie 不会被设置 |
| SameSite=None 需要 Secure | 本地开发时不能用 `SameSite=None` |
| 跨域 Cookie 需要特殊配置 | 前端 localhost:5173 + 后端 localhost:8000 是跨域 |

**本地开发推荐方案**：

```
方案 1: Vite 代理（推荐）
  vite.config.ts 中配置 proxy，将 /api 请求代理到后端
  → 浏览器视为同域，Cookie 正常工作
  → 无需处理 CORS

方案 2: 跨域配置
  前端: http://localhost:5173
  后端: http://localhost:8000
  → 后端 CORS 配置:
    - allow_credentials=True
    - allow_origins=["http://localhost:5173"]  // 不能用 *
  → 前端 Axios: withCredentials=true
  → Cookie: SameSite=None; Secure（localhost 不支持！）
  → ⚠️ 此方案在 localhost 上有问题
```

**Vite 代理配置示例（推荐）**：

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Cookie 代理需要保留 cookie domain
        cookieDomainRewrite: {
          '*': '',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

使用代理时，`.env` 中 `VITE_API_BASE_URL` 应留空或设为 `/api`：

```env
# 本地开发（使用 Vite 代理）
VITE_API_BASE_URL=

# 生产环境
VITE_API_BASE_URL=https://api.soupcircle.xyz
```

### 9.3 CORS 配置要求

**后端必须配置**（否则浏览器会拦截 Set-Cookie 响应）：

```python
# 后端 FastAPI 示例
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",
        "http://localhost:5173",  # 本地开发
    ],
    allow_credentials=True,       # ⚠️ 必须为 True
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**关键注意事项**：

- `allow_credentials=True` 时，`allow_origins` 不能为 `["*"]`，必须明确指定域名
- 生产环境的域名必须在 `allow_origins` 列表中
- Cookie 的 `Domain` 属性必须与前端域名匹配

### 9.4 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 登录后 Cookie 没有设置 | 后端未返回 `Set-Cookie` 头 | 检查后端 login 接口响应 |
| Cookie 设置了但请求没有携带 | `withCredentials` 未设为 true | 检查 axios 实例配置 |
| 跨域请求 Cookie 丢失 | CORS 配置不正确 | 检查 `allow_credentials` 和 `allow_origins` |
| localhost 开发 Cookie 不生效 | `Secure` 标志 + HTTP | 使用 Vite proxy 或移除 Secure 标志（仅开发环境） |
| 401 循环跳转 | checkAuth 失败也触发 401 | checkAuth 中的 401 不应触发跳转，需特殊处理 |
| TypeScript 报错找不到 User 类型 | 未导出类型 | 确保 authStore 正确导出 User 类型 |

**401 循环跳转的特殊处理**：

在 `checkAuth()` 方法中调用 `/api/users/profile` 时，如果返回 401，axios 拦截器会触发跳转。但 `checkAuth` 本身就是用来检查登录状态的，不应该触发跳转。解决方案：

```ts
// 方案 1: 在 checkAuth 中捕获 401，不让它到达拦截器
// 但 axios 拦截器是全局的，无法针对单个请求跳过

// 方案 2（推荐）: 在拦截器中判断当前是否正在初始化
// 给请求添加自定义标记
checkAuth: async () => {
  try {
    const response = await http.get<{ user: User }>('/api/users/profile', {
      // 自定义标记，告诉拦截器这是初始化检查
      headers: { 'X-Auth-Check': 'true' },
    });
    // ...
  } catch {
    // ...
  }
}

// 在拦截器中检查
if (error.response?.status === 401) {
  // 如果是认证检查请求，不触发跳转
  if (error.config?.headers?.['X-Auth-Check'] === 'true') {
    return Promise.reject(error);
  }
  // 其他请求的 401 正常处理
  // ...
}
```

**请 Cursor 在实现时采用方案 2，给 checkAuth 的请求添加 `X-Auth-Check` 头，并在拦截器中对此类请求的 401 跳过跳转逻辑。**

### 9.5 测试清单

- [ ] 登录后，Application → Cookies 中能看到 HttpOnly Cookie
- [ ] 登录后，`localStorage` 中没有任何 token 数据
- [ ] 登录后，`document.cookie` 中看不到 access_token
- [ ] 发送 API 请求时，Network 面板中请求自动携带了 Cookie
- [ ] 刷新页面后，仍然保持登录状态（Cookie 未过期）
- [ ] 关闭浏览器重新打开，仍然保持登录状态（Cookie 持久化）
- [ ] 退出登录后，Cookie 被清除
- [ ] Token 过期后，后端自动续期，前端继续正常工作
- [ ] 收到 401 后，正确跳转到登录页
- [ ] 登录后，正确跳转回之前访问的页面（redirect 参数）
- [ ] 本地开发环境（Vite proxy），Cookie 正常工作
- [ ] TypeScript 编译无错误（`npx tsc --noEmit`）

### 9.6 回滚方案

如果迁移后出现问题需要回滚：

1. Git 回退到迁移前的 commit
2. 后端保持双模式鉴权兼容（过渡期不要移除 Authorization header 支持）
3. 重新部署前端

---

## 十、全局搜索与清理清单

迁移完成后，需要全局搜索确认没有遗漏的 localStorage token 操作：

```bash
# 搜索所有可能残留的 localStorage token 操作
grep -rn "localStorage.*token" src/
grep -rn "localStorage.*access" src/
grep -rn "localStorage.*auth" src/
grep -rn "getItem.*token" src/
grep -rn "setItem.*token" src/
grep -rn "removeItem.*token" src/
grep -rn "Authorization.*Bearer" src/

# 搜索所有 VITE_TOKEN_KEY 的使用
grep -rn "VITE_TOKEN_KEY" src/
grep -rn "VITE_TOKEN_KEY" .env*
```

**预期结果**：所有搜索结果应为空。如果有残留，说明遗漏了改动。

---

## 十一、验收标准

| 编号 | 验收项 | 验收条件 |
|------|-------|---------|
| AC-1 | Token 不可见 | `document.cookie` 不包含 access_token |
| AC-2 | localStorage 无 token | `localStorage` 中无任何 token 相关数据 |
| AC-3 | Cookie 自动携带 | API 请求自动携带 Cookie，无需手动设置 Header |
| AC-4 | 自动续期无感知 | 后端自动续期后，前端继续正常工作，用户无感知 |
| AC-5 | 401 正确跳转 | Token 过期且无法续期时，跳转到登录页 |
| AC-6 | 登录后回跳 | 从登录页登录后，回到之前访问的页面 |
| AC-7 | 退出登录 | 退出后 Cookie 被清除，无法访问受保护页面 |
| AC-8 | 页面刷新 | 刷新页面后，通过 Cookie 恢复登录状态 |
| AC-9 | XSS 防护 | 即使存在 XSS 漏洞，攻击者无法获取 token |
| AC-10 | TypeScript | `npx tsc --noEmit` 零错误 |

---

## 十二、附录

### A. 后端 Cookie 设置规范（供后端参考）

```python
# 后端设置 Cookie 的推荐参数
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,          # JS 不可读
    secure=True,            # 仅 HTTPS 传输（生产环境）
    samesite="lax",         # CSRF 防护
    max_age=7 * 24 * 3600,  # 7 天（与 token 有效期一致）
    path="/",               # 所有路径有效
    # domain=".example.com"  # 如需跨子域共享
)
```

### B. 关键术语对照

| 术语 | 含义 |
|------|------|
| HttpOnly | Cookie 属性，阻止 JavaScript 访问 Cookie |
| Secure | Cookie 属性，仅通过 HTTPS 传输 |
| SameSite | Cookie 属性，控制跨站请求时是否发送 Cookie |
| withCredentials | Axios 配置，允许跨域请求携带 Cookie |
| Set-Cookie | HTTP 响应头，服务端指示浏览器设置 Cookie |
| checkAuth | 应用启动时检查认证状态的函数 |
| fetchProfile | 获取当前登录用户信息的函数 |

### C. 文件依赖图

```
.env
 └── src/lib/axios.ts
      └── src/stores/authStore.ts
           ├── src/App.tsx
           ├── src/components/ProtectedRoute.tsx
           ├── src/pages/Auth/LoginPage.tsx
           ├── src/pages/Auth/RegisterPage.tsx
           └── src/hooks/useTokenStatus.ts (可选)
```

### D. 迁移前后代码行数对比（预估）

| 文件 | 迁移前 | 迁移后 | 变化 |
|------|-------|-------|------|
| `axios.ts` | ~60 行 | ~100 行 | +40（错误处理增强） |
| `authStore.ts` | ~80 行 | ~160 行 | +80（新增 checkAuth/fetchProfile） |
| `ProtectedRoute.tsx` | ~15 行 | ~65 行 | +50（loading + checkAuth） |
| `LoginPage.tsx` | ~50 行 | ~85 行 | +35（redirect 逻辑） |
| `RegisterPage.tsx` | ~50 行 | ~100 行 | +50（redirect + 密码确认） |
| `App.tsx` | ~40 行 | ~70 行 | +30（初始化 loading） |
| `.env` | ~5 行 | ~3 行 | -2（移除 token 变量） |
| **总计** | **~300 行** | **~580 行** | **+280** |

> 代码行数增加主要来自：完善的错误处理、loading 状态管理、类型定义、注释。
> 实际复杂度并未增加——移除了手动 token 管理逻辑，增加了 Cookie 自动管理的适配代码。

---

*文档版本：v1.0*
*适用项目：汤圆的代码助手*
*生成时间：2025 年*

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
