import { getWebSocketApiBase } from '@/lib/backendConfig';

/** Build WebSocket URL for an execution stream. */
export function buildExecutionWsUrl(executionId: string): string {
  return `${getWebSocketApiBase()}/executions/${executionId}/stream`;
}
