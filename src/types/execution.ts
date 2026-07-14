/** Phase 5 — workflow execution engine types */

export type NodeExecutionStatus =
  | 'pending'
  | 'idle'
  | 'running'
  | 'success'
  | 'error'
  | 'waiting_review'
  | 'skipped';

export type ExecutionStatus =
  | 'idle'
  | 'configuring'
  | 'connecting'
  | 'running'
  | 'waiting_review'
  | 'completed'
  | 'failed'
  | 'stopped';

export type WSConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type ReviewAction = 'approve' | 'reject' | 'approve_with_modification';

export interface ReviewRecord {
  action: ReviewAction;
  comment?: string;
  modifiedOutput?: Record<string, unknown>;
  reviewedAt: string;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LogEntry {
  id: string;
  nodeId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface NodeExecutionState {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: NodeExecutionStatus;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  duration: number | null;
  tokens: TokenUsage | null;
  estimatedCost: number | null;
  model: string | null;
  agentName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  reviewRecords: ReviewRecord[];
}

export interface StartExecutionRequest {
  workflowId: string;
  inputValues: Record<string, unknown>;
}

export interface StartExecutionResponse {
  executionId: string;
  workflowId: string;
  status: 'pending';
  createdAt: string;
}

export interface NodeResultDetail {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: NodeExecutionStatus;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  tokens: TokenUsage | null;
  estimatedCost: number | null;
  model: string | null;
  reviewRecords: ReviewRecord[] | null;
}

export interface ExecutionDetail {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  inputValues: Record<string, unknown>;
  output: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
  totalDuration: number | null;
  totalTokens: TokenUsage | null;
  estimatedCost: number | null;
  nodeResults: NodeResultDetail[];
  errorMessage: string | null;
  failedNodeId: string | null;
}

export interface ExecutionListParams {
  workflowId?: string;
  status?: ExecutionStatus;
  page?: number;
  pageSize?: number;
}

export interface ExecutionListResponse {
  items: ExecutionDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SubmitReviewRequest {
  nodeId: string;
  action: ReviewAction;
  comment?: string;
  modifiedOutput?: Record<string, unknown>;
}

export interface WSPingMessage {
  type: 'ping';
}

export interface WSReviewActionMessage {
  type: 'review_action';
  data: {
    executionId: string;
    nodeId: string;
    action: ReviewAction;
    modifiedOutput?: Record<string, unknown>;
    comment?: string;
  };
}

export interface WSStopExecutionMessage {
  type: 'stop_execution';
  data: { executionId: string };
}

export type WSClientMessage = WSPingMessage | WSReviewActionMessage | WSStopExecutionMessage;

export interface WSPongMessage {
  type: 'pong';
}

export interface WSExecutionStartedMessage {
  type: 'execution_started';
  data: {
    executionId: string;
    workflowId: string;
    workflowName: string;
    startedAt: string;
    totalNodes: number;
    inputValues: Record<string, unknown>;
  };
}

export interface WSNodeStatusMessage {
  type: 'node_status';
  data: {
    nodeId: string;
    nodeType: string;
    status: NodeExecutionStatus;
    startedAt?: string;
    completedAt?: string;
    error?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    meta?: {
      duration: number;
      tokens: TokenUsage;
      estimatedCost?: number;
      model?: string;
      agentName?: string;
    };
  };
}

export interface WSLogMessage {
  type: 'log';
  data: {
    nodeId: string;
    level: LogEntry['level'];
    message: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  };
}

export interface WSWaitingForReviewMessage {
  type: 'waiting_for_review';
  data: {
    executionId: string;
    nodeId: string;
    nodeName: string;
    reviewConfig: { description?: string; timeout?: number };
    inputData: Record<string, unknown>;
    timeoutAt?: string;
  };
}

export interface WSReviewTimeoutMessage {
  type: 'review_timeout';
  data: { nodeId: string; timeoutAt: string };
}

export interface WSExecutionCompletedMessage {
  type: 'execution_completed';
  data: {
    executionId: string;
    status: 'completed' | 'failed' | 'stopped';
    completedAt: string;
    totalDuration: number;
    totalTokens: TokenUsage;
    estimatedCost: number;
    output: Record<string, unknown>;
    nodeResults: Array<{
      nodeId: string;
      nodeName: string;
      status: NodeExecutionStatus;
      duration: number;
    }>;
    failedNodeId?: string;
    errorMessage?: string;
  };
}

export interface WSExecutionFailedMessage {
  type: 'execution_failed';
  data: {
    executionId: string;
    failedNodeId: string;
    failedNodeName: string;
    error: {
      code: string;
      message: string;
      details?: string;
      stackTrace?: string;
    };
    completedNodes: string[];
    totalDuration: number;
  };
}

export type WSServerMessage =
  | WSPongMessage
  | WSExecutionStartedMessage
  | WSNodeStatusMessage
  | WSLogMessage
  | WSWaitingForReviewMessage
  | WSReviewTimeoutMessage
  | WSExecutionCompletedMessage
  | WSExecutionFailedMessage;

export type WebSocketMessage = WSClientMessage | WSServerMessage;

export interface StartNodeInputVariable {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  default?: string;
}
