import { create } from 'zustand';
import type {
  ExecutionStatus,
  LogEntry,
  NodeExecutionState,
  ReviewRecord,
  TokenUsage,
  WSConnectionStatus,
} from '@/types/execution';

interface ExecutionState {
  executionId: string | null;
  workflowId: string | null;
  workflowName: string | null;
  status: ExecutionStatus;
  startedAt: string | null;
  completedAt: string | null;
  inputValues: Record<string, unknown> | null;
  nodeStates: Map<string, NodeExecutionState>;
  logs: LogEntry[];
  totalDuration: number;
  totalTokens: TokenUsage;
  estimatedCost: number;
  completedNodeCount: number;
  totalNodeCount: number;
  currentReviewNodeId: string | null;
  reviewInputData: Record<string, unknown> | null;
  reviewDescription: string | null;
  finalOutput: Record<string, unknown> | null;
  errorMessage: string | null;
  failedNodeId: string | null;
  wsConnectionStatus: WSConnectionStatus;

  setExecutionId: (id: string) => void;
  setWorkflowMeta: (workflowId: string, workflowName: string) => void;
  setStatus: (status: ExecutionStatus) => void;
  setStartedAt: (time: string) => void;
  setInputValues: (values: Record<string, unknown>) => void;
  initNodeStates: (nodes: Array<{ id: string; name: string; type: string }>) => void;
  updateNodeStatus: (nodeId: string, update: Partial<NodeExecutionState>) => void;
  getNodeState: (nodeId: string) => NodeExecutionState | undefined;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  incrementTokens: (tokens: TokenUsage) => void;
  addCost: (cost: number) => void;
  incrementCompletedNodes: () => void;
  setTotalNodeCount: (count: number) => void;
  setCurrentReviewNodeId: (nodeId: string | null) => void;
  setReviewContext: (
    nodeId: string | null,
    inputData: Record<string, unknown> | null,
    description: string | null,
  ) => void;
  addReviewRecord: (nodeId: string, record: ReviewRecord) => void;
  setCompleted: (output: Record<string, unknown>, totalDuration: number) => void;
  setFailed: (failedNodeId: string, errorMessage: string) => void;
  setStopped: () => void;
  setTotalDuration: (ms: number) => void;
  setWsConnectionStatus: (status: WSConnectionStatus) => void;
  reset: () => void;
}

const emptyTokens: TokenUsage = {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
};

const initialState = {
  executionId: null as string | null,
  workflowId: null as string | null,
  workflowName: null as string | null,
  status: 'idle' as ExecutionStatus,
  startedAt: null as string | null,
  completedAt: null as string | null,
  inputValues: null as Record<string, unknown> | null,
  nodeStates: new Map<string, NodeExecutionState>(),
  logs: [] as LogEntry[],
  totalDuration: 0,
  totalTokens: { ...emptyTokens },
  estimatedCost: 0,
  completedNodeCount: 0,
  totalNodeCount: 0,
  currentReviewNodeId: null as string | null,
  reviewInputData: null as Record<string, unknown> | null,
  reviewDescription: null as string | null,
  finalOutput: null as Record<string, unknown> | null,
  errorMessage: null as string | null,
  failedNodeId: null as string | null,
  wsConnectionStatus: 'disconnected' as WSConnectionStatus,
};

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  ...initialState,

  setExecutionId: (id) => set({ executionId: id }),
  setWorkflowMeta: (workflowId, workflowName) => set({ workflowId, workflowName }),
  setStatus: (status) => set({ status }),
  setStartedAt: (time) => set({ startedAt: time }),
  setInputValues: (values) => set({ inputValues: values }),

  initNodeStates: (nodes) => {
    const map = new Map<string, NodeExecutionState>();
    nodes.forEach((node) => {
      map.set(node.id, {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        status: 'pending',
        input: null,
        output: null,
        error: null,
        duration: null,
        tokens: null,
        estimatedCost: null,
        model: null,
        agentName: null,
        startedAt: null,
        completedAt: null,
        reviewRecords: [],
      });
    });
    set({ nodeStates: map, totalNodeCount: nodes.length, completedNodeCount: 0 });
  },

  updateNodeStatus: (nodeId, update) => {
    const { nodeStates } = get();
    const existing = nodeStates.get(nodeId);
    if (!existing) return;
    const newMap = new Map(nodeStates);
    newMap.set(nodeId, { ...existing, ...update });
    set({ nodeStates: newMap });
  },

  getNodeState: (nodeId) => get().nodeStates.get(nodeId),

  addLog: (log) =>
    set((state) => ({
      logs: state.logs.length > 2000 ? [...state.logs.slice(-1500), log] : [...state.logs, log],
    })),

  clearLogs: () => set({ logs: [] }),

  incrementTokens: (tokens) =>
    set((state) => ({
      totalTokens: {
        prompt_tokens: state.totalTokens.prompt_tokens + tokens.prompt_tokens,
        completion_tokens: state.totalTokens.completion_tokens + tokens.completion_tokens,
        total_tokens: state.totalTokens.total_tokens + tokens.total_tokens,
      },
    })),

  addCost: (cost) => set((state) => ({ estimatedCost: state.estimatedCost + cost })),

  incrementCompletedNodes: () =>
    set((state) => ({ completedNodeCount: state.completedNodeCount + 1 })),

  setTotalNodeCount: (count) => set({ totalNodeCount: count }),

  setCurrentReviewNodeId: (nodeId) => set({ currentReviewNodeId: nodeId }),

  setReviewContext: (nodeId, inputData, description) =>
    set({
      currentReviewNodeId: nodeId,
      reviewInputData: inputData,
      reviewDescription: description,
    }),

  addReviewRecord: (nodeId, record) => {
    const { nodeStates } = get();
    const existing = nodeStates.get(nodeId);
    if (!existing) return;
    const newMap = new Map(nodeStates);
    newMap.set(nodeId, {
      ...existing,
      reviewRecords: [...existing.reviewRecords, record],
    });
    set({ nodeStates: newMap });
  },

  setCompleted: (output, totalDuration) =>
    set({
      status: 'completed',
      finalOutput: output,
      totalDuration,
      completedAt: new Date().toISOString(),
      currentReviewNodeId: null,
    }),

  setFailed: (failedNodeId, errorMessage) =>
    set({
      status: 'failed',
      failedNodeId,
      errorMessage,
      completedAt: new Date().toISOString(),
      currentReviewNodeId: null,
    }),

  setStopped: () =>
    set({
      status: 'stopped',
      completedAt: new Date().toISOString(),
      currentReviewNodeId: null,
    }),

  setTotalDuration: (ms) => set({ totalDuration: ms }),

  setWsConnectionStatus: (status) => set({ wsConnectionStatus: status }),

  reset: () => set({ ...initialState, nodeStates: new Map(), totalTokens: { ...emptyTokens }, logs: [] }),
}));

export function isExecutionActive(status: ExecutionStatus): boolean {
  return (
    status === 'connecting' ||
    status === 'running' ||
    status === 'waiting_review' ||
    status === 'configuring'
  );
}
