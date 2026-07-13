import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from '@/components/ui/Toast';
import { authStorage } from '@/lib/authStorage';
import type { RefreshTokenResponse } from '@/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
}

function redirectToLogin(message?: string) {
  authStorage.clear();
  if (message) toast.error(message);
  if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    window.location.href = '/login';
  }
}

instance.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      const refreshToken = authStorage.getRefreshToken();

      if (!refreshToken) {
        redirectToLogin('登录已过期，请重新登录');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => instance(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<RefreshTokenResponse>(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        authStorage.setTokens(data.access_token, data.refresh_token);
        processQueue(null);
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        redirectToLogin('登录已过期，请重新登录');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!error.response) {
      toast.error('网络连接失败，请检查网络');
      return Promise.reject(error);
    }

    const status = error.response.status;
    if (status === 403) {
      toast.error('无权限访问');
    } else if (status === 500 || status === 502 || status === 503) {
      toast.error('服务器异常，请稍后重试');
    }

    return Promise.reject(error);
  },
);

export default instance;
