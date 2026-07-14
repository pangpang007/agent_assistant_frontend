/**
 * @deprecated Use useExecutionWebSocket + useExecutionMessageHandler directly.
 * Thin compatibility wrapper for legacy call sites.
 */
import { useExecutionMessageHandler } from './useExecutionMessageHandler';
import { useExecutionWebSocket } from './useExecutionWebSocket';
import { useExecutionStore } from '@/stores/executionStore';

export function useWorkflowWebSocket(executionId: string | null) {
  const handleMessage = useExecutionMessageHandler();
  const setWsConnectionStatus = useExecutionStore((s) => s.setWsConnectionStatus);

  return useExecutionWebSocket({
    executionId,
    onMessage: handleMessage,
    onStatusChange: setWsConnectionStatus,
    autoConnect: Boolean(executionId),
  });
}
