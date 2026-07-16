import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from '@/components/ui/Toast';
import { getApiBaseUrl } from '@/lib/backendConfig';
import { isApiEnvelope, isApiSuccessCode } from '@/lib/apiEnvelope';

const BASE_URL = getApiBaseUrl();

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  withCredentials: true, // HttpOnly Cookie 由浏览器自动携带
  headers: { 'Content-Type': 'application/json' },
});

/** Prevent concurrent 401s from triggering multiple redirects. */
let isRedirectingToLogin = false;

function isAuthCheckRequest(config?: InternalAxiosRequestConfig): boolean {
  if (!config?.headers) return false;
  const value = config.headers['X-Auth-Check'] ?? config.headers['x-auth-check'];
  return value === 'true' || value === true;
}

function redirectToLogin() {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  window.dispatchEvent(new CustomEvent('auth:unauthorized'));

  const currentPath = window.location.pathname + window.location.search;
  const redirectUrl =
    currentPath !== '/' &&
    currentPath !== '/login' &&
    !currentPath.startsWith('/login?') &&
    currentPath !== '/register' &&
    !currentPath.startsWith('/register?')
      ? `/login?redirect=${encodeURIComponent(currentPath)}`
      : '/login';

  window.location.href = redirectUrl;

  window.setTimeout(() => {
    isRedirectingToLogin = false;
  }, 3000);
}

instance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => {
    const tokenRefreshed = response.headers['x-token-refreshed'];
    if (tokenRefreshed === 'true' && import.meta.env.DEV) {
      console.debug('[Auth] Token 已自动续期');
    }

    const body = response.data;

    // Unwrap { code, message, data } so callers get `data` directly
    if (isApiEnvelope(body)) {
      if (!isApiSuccessCode(body.code)) {
        const message =
          typeof body.message === 'string' && body.message ? body.message : '请求失败';
        return Promise.reject(
          Object.assign(new Error(message), {
            isAxiosError: true,
            response: {
              ...response,
              status: response.status,
              data: body,
            },
            config: response.config,
          }),
        );
      }
      return body.data;
    }

    return body;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? '';

    if (status === 401) {
      const skipRedirect =
        isAuthCheckRequest(originalRequest) ||
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh');

      if (!skipRedirect) {
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    if (!error.response) {
      toast.error('网络连接异常，请检查网络后重试');
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error('没有权限执行此操作');
    } else if (status === 500 || status === 502 || status === 503) {
      toast.error('服务器异常，请稍后重试');
    }

    return Promise.reject(error);
  },
);

export default instance;
