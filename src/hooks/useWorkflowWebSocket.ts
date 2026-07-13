import { useEffect, useRef } from 'react';
import { toast } from '@/components/ui/Toast';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/api';

export function useWorkflowWebSocket(executionId: string | null) {
  const updateNodeExecutionStatus = useWorkflowEditorStore((s) => s.updateNodeExecutionStatus);
  const setExecutionStatus = useWorkflowEditorStore((s) => s.setExecutionStatus);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!executionId) return;

    let ws: WebSocket | null = null;
    let cancelled = false;
    let retryTimer: number | undefined;

    const connect = () => {
      if (cancelled) return;
      ws = new WebSocket(`${WS_BASE}/executions/${executionId}/stream`);

      ws.onopen = () => {
        retryRef.current = 0;
        setExecutionStatus('running');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as {
            type: string;
            data?: {
              nodeId: string;
              status: 'running' | 'success' | 'error' | 'waiting_review' | 'skipped';
              result?: unknown;
            };
          };
          if (message.type === 'node_status' && message.data) {
            updateNodeExecutionStatus(
              message.data.nodeId,
              message.data.status,
              message.data.result,
            );
          }
          if (message.type === 'execution_complete') {
            setExecutionStatus('completed');
          }
          if (message.type === 'execution_failed') {
            setExecutionStatus('failed');
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        if (retryRef.current < 3) {
          const delay = 1000 * 2 ** retryRef.current;
          retryRef.current += 1;
          retryTimer = window.setTimeout(connect, delay);
        } else {
          toast.warning('执行状态连接断开，请刷新页面');
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      ws?.close();
    };
  }, [executionId, setExecutionStatus, updateNodeExecutionStatus]);
}
