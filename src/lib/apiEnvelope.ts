/**
 * Backend success envelope: { code: 0, message: "success", data: T }
 * Error body may be: { error: { code, message, details } }
 */

export interface ApiEnvelope<T = unknown> {
  code: number | string;
  message?: string;
  data: T;
}

export function isApiEnvelope(body: unknown): body is ApiEnvelope {
  return (
    !!body &&
    typeof body === 'object' &&
    'code' in body &&
    'data' in body
  );
}

export function unwrapApiData<T = unknown>(body: unknown): T {
  if (isApiEnvelope(body)) {
    return body.data as T;
  }
  return body as T;
}

export function isApiSuccessCode(code: number | string): boolean {
  return code === 0 || code === '0' || code === 'success';
}
