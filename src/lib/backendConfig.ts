const LOCAL_BACKEND = 'http://localhost:8000';

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Backend origin from Vercel `BACKEND_URL`, or local default. */
export function getBackendUrl(): string {
  const fromEnv = import.meta.env.BACKEND_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  return LOCAL_BACKEND;
}

/** REST API base URL used by axios (`/api` on the backend). */
export function getApiBaseUrl(): string {
  if (import.meta.env.BACKEND_URL?.trim()) {
    return `${getBackendUrl()}/api`;
  }

  // Local dev: keep Vite proxy at /api → localhost:8000
  if (import.meta.env.DEV) {
    return '/api';
  }

  return `${LOCAL_BACKEND}/api`;
}

/** WebSocket API base (executions stream lives under /api). */
export function getWebSocketApiBase(): string {
  const apiBase = getApiBaseUrl();

  if (apiBase.startsWith('/')) {
    return `ws://${LOCAL_BACKEND.replace(/^https?:\/\//, '')}/api`;
  }

  return apiBase.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
}
