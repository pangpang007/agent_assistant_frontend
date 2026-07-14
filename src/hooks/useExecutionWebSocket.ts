import { useCallback, useEffect, useRef, useState } from 'react';
import type { WSClientMessage, WSConnectionStatus, WebSocketMessage } from '@/types/execution';
import { buildExecutionWsUrl } from '@/utils/websocketUrl';

interface UseExecutionWebSocketOptions {
  executionId: string | null;
  onMessage: (message: WebSocketMessage) => void;
  onStatusChange?: (status: WSConnectionStatus) => void;
  autoConnect?: boolean;
}

interface UseExecutionWebSocketReturn {
  status: WSConnectionStatus;
  send: (message: WSClientMessage) => void;
  connect: () => void;
  disconnect: () => void;
  lastMessage: WebSocketMessage | null;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL_MS = 30_000;

export function useExecutionWebSocket({
  executionId,
  onMessage,
  onStatusChange,
  autoConnect = true,
}: UseExecutionWebSocketOptions): UseExecutionWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectCountRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  const onStatusChangeRef = useRef(onStatusChange);

  const [status, setStatus] = useState<WSConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const updateStatus = useCallback((next: WSConnectionStatus) => {
    setStatus(next);
    onStatusChangeRef.current?.(next);
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current !== null) {
      window.clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const clearReconnect = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatTimerRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' } satisfies WSClientMessage));
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [clearHeartbeat]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    clearHeartbeat();
    clearReconnect();
    reconnectCountRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close(1000, 'client disconnect');
      wsRef.current = null;
    }
    updateStatus('disconnected');
  }, [clearHeartbeat, clearReconnect, updateStatus]);

  const connect = useCallback(() => {
    if (!executionId) return;
    intentionalCloseRef.current = false;
    clearReconnect();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    updateStatus(reconnectCountRef.current > 0 ? 'reconnecting' : 'connecting');
    const ws = new WebSocket(buildExecutionWsUrl(executionId));
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectCountRef.current = 0;
      updateStatus('connected');
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as WebSocketMessage;
        setLastMessage(message);
        onMessageRef.current(message);
      } catch {
        // ignore malformed
      }
    };

    ws.onclose = (event) => {
      clearHeartbeat();
      wsRef.current = null;
      if (intentionalCloseRef.current || event.code === 1000) {
        updateStatus('disconnected');
        return;
      }
      if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = 1000 * 2 ** reconnectCountRef.current;
        reconnectCountRef.current += 1;
        updateStatus('reconnecting');
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      } else {
        updateStatus('disconnected');
      }
    };

    ws.onerror = () => {
      // onclose will handle reconnect
    };
  }, [clearHeartbeat, clearReconnect, executionId, startHeartbeat, updateStatus]);

  const send = useCallback((message: WSClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (!autoConnect || !executionId) {
      disconnect();
      return;
    }
    connect();
    return () => {
      intentionalCloseRef.current = true;
      clearHeartbeat();
      clearReconnect();
      wsRef.current?.close(1000);
      wsRef.current = null;
    };
  }, [autoConnect, clearHeartbeat, clearReconnect, connect, disconnect, executionId]);

  return { status, send, connect, disconnect, lastMessage };
}
