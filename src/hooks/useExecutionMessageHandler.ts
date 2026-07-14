import { useCallback } from 'react';
import { useExecutionStore } from '@/stores/executionStore';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { NodeExecutionStatus, WebSocketMessage, WSServerMessage } from '@/types/execution';

function isServerMessage(message: WebSocketMessage): message is WSServerMessage {
  return (
    message.type === 'pong' ||
    message.type === 'execution_started' ||
    message.type === 'node_status' ||
    message.type === 'log' ||
    message.type === 'waiting_for_review' ||
    message.type === 'review_timeout' ||
    message.type === 'execution_completed' ||
    message.type === 'execution_failed'
  );
}

function mapCanvasStatus(status: NodeExecutionStatus): NodeExecutionStatus {
  return status === 'pending' ? 'idle' : status;
}

export function useExecutionMessageHandler() {
  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (!isServerMessage(message)) return;

    const store = useExecutionStore.getState();
    const editor = useWorkflowEditorStore.getState();

    switch (message.type) {
      case 'pong':
        break;

      case 'execution_started': {
        store.setStatus('running');
        store.setStartedAt(message.data.startedAt);
        store.setExecutionId(message.data.executionId);
        store.setWorkflowMeta(message.data.workflowId, message.data.workflowName);
        store.setInputValues(message.data.inputValues);
        store.setTotalNodeCount(message.data.totalNodes);
        const nodes = editor.nodes;
        store.initNodeStates(
          nodes.map((n) => ({
            id: n.id,
            name: n.data.label,
            type: n.data.nodeType,
          })),
        );
        nodes.forEach((n) => {
          editor.updateNodeData(n.id, { executionStatus: 'idle' });
        });
        editor.setExecutionStatus('running');
        editor.setExecutionId(message.data.executionId);
        break;
      }

      case 'node_status': {
        const { nodeId, status, input, output, meta, error, startedAt, completedAt } =
          message.data;
        const wasTerminal =
          store.getNodeState(nodeId)?.status === 'success' ||
          store.getNodeState(nodeId)?.status === 'skipped';

        store.updateNodeStatus(nodeId, {
          status,
          input: input ?? null,
          output: output ?? null,
          error: error ?? null,
          duration: meta?.duration ?? null,
          tokens: meta?.tokens ?? null,
          estimatedCost: meta?.estimatedCost ?? null,
          model: meta?.model ?? null,
          agentName: meta?.agentName ?? null,
          startedAt: startedAt ?? null,
          completedAt: completedAt ?? null,
        });

        editor.updateNodeData(nodeId, {
          executionStatus: mapCanvasStatus(status),
          executionResult: output ?? null,
          executionMeta: meta
            ? { duration: meta.duration, tokens: meta.tokens.total_tokens }
            : undefined,
        });
        editor.updateNodeExecutionStatus(nodeId, mapCanvasStatus(status), output);

        if (!wasTerminal && (status === 'success' || status === 'skipped')) {
          store.incrementCompletedNodes();
        }
        if (meta?.tokens) store.incrementTokens(meta.tokens);
        if (meta?.estimatedCost) store.addCost(meta.estimatedCost);
        break;
      }

      case 'log':
        store.addLog({
          id: `${message.data.nodeId}-${message.data.timestamp}-${Math.random().toString(36).slice(2, 7)}`,
          nodeId: message.data.nodeId,
          level: message.data.level,
          message: message.data.message,
          timestamp: message.data.timestamp,
          metadata: message.data.metadata,
        });
        break;

      case 'waiting_for_review':
        store.setStatus('waiting_review');
        store.setReviewContext(
          message.data.nodeId,
          message.data.inputData,
          message.data.reviewConfig.description ?? null,
        );
        store.updateNodeStatus(message.data.nodeId, {
          status: 'waiting_review',
          input: message.data.inputData,
        });
        editor.updateNodeData(message.data.nodeId, { executionStatus: 'waiting_review' });
        editor.setExecutionStatus('running');
        break;

      case 'review_timeout':
        store.updateNodeStatus(message.data.nodeId, {
          status: 'error',
          error: '审核超时',
        });
        editor.updateNodeData(message.data.nodeId, { executionStatus: 'error' });
        break;

      case 'execution_completed':
        if (message.data.status === 'completed') {
          store.setCompleted(message.data.output, message.data.totalDuration);
          editor.setExecutionStatus('completed');
        } else if (message.data.status === 'failed') {
          store.setFailed(
            message.data.failedNodeId ?? '',
            message.data.errorMessage ?? '执行失败',
          );
          editor.setExecutionStatus('failed');
        } else {
          store.setStopped();
          editor.setExecutionStatus('failed');
        }
        if (message.data.totalTokens) {
          store.incrementTokens({
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          });
          useExecutionStore.setState({
            totalTokens: message.data.totalTokens,
            estimatedCost: message.data.estimatedCost,
            totalDuration: message.data.totalDuration,
          });
        }
        break;

      case 'execution_failed':
        store.setFailed(message.data.failedNodeId, message.data.error.message);
        store.setTotalDuration(message.data.totalDuration);
        editor.setExecutionStatus('failed');
        break;

      default:
        break;
    }
  }, []);

  return handleMessage;
}
