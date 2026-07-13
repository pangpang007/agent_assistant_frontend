import { create } from 'zustand';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import { autoLayout } from '@/lib/workflow/autoLayout';
import { createWorkflowNode } from '@/lib/workflow/nodeDefaults';
import { validateWorkflow } from '@/lib/workflow/workflowValidation';
import type {
  NodeExecutionStatus,
  NodeType,
  ValidationIssue,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
  WorkflowVersion,
} from '@/types';

type RightPanel = 'properties' | 'debug' | 'execution';

interface HistorySnapshot {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface ContextMenuState {
  open: boolean;
  x: number;
  y: number;
  targetNodeId: string | null;
  targetEdgeId: string | null;
}

interface WorkflowEditorState {
  workflowId: string | null;
  workflowName: string;
  workflowDescription: string;
  currentVersionNumber: number;
  isDirty: boolean;

  nodes: WorkflowNode[];
  edges: WorkflowEdge[];

  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  rightPanel: RightPanel;
  isNodeLibraryCollapsed: boolean;
  contextMenu: ContextMenuState;

  versions: WorkflowVersion[];
  currentVersionId: string | null;

  validationIssues: ValidationIssue[];

  history: HistorySnapshot[];
  historyIndex: number;
  maxHistoryLength: number;

  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;

  executionId: string | null;
  executionStatus: 'idle' | 'running' | 'completed' | 'failed';

  setWorkflowMeta: (id: string, name: string, desc?: string, version?: number) => void;
  setDirty: (dirty: boolean) => void;

  setNodes: (nodes: WorkflowNode[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  addNode: (node: WorkflowNode) => void;
  addNodeByType: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  setEdges: (edges: WorkflowEdge[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  removeEdge: (edgeId: string) => void;

  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  setRightPanel: (panel: RightPanel) => void;
  toggleNodeLibrary: () => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setVersions: (versions: WorkflowVersion[]) => void;
  setCurrentVersionId: (versionId: string | null) => void;
  setCurrentVersionNumber: (version: number) => void;

  runValidation: () => ValidationIssue[];
  setValidationIssues: (issues: ValidationIssue[]) => void;
  clearValidationIssues: () => void;

  setExecutionId: (id: string | null) => void;
  setExecutionStatus: (status: WorkflowEditorState['executionStatus']) => void;
  updateNodeExecutionStatus: (
    nodeId: string,
    status: NodeExecutionStatus,
    result?: unknown,
  ) => void;

  openContextMenu: (
    x: number,
    y: number,
    nodeId?: string | null,
    edgeId?: string | null,
  ) => void;
  closeContextMenu: () => void;

  applyAutoLayout: () => void;
  loadFromWorkflow: (
    id: string,
    name: string,
    description: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    version?: number,
  ) => void;
  markSaved: (savedAt?: string, version?: number) => void;
  reset: () => void;
}

const initialContextMenu: ContextMenuState = {
  open: false,
  x: 0,
  y: 0,
  targetNodeId: null,
  targetEdgeId: null,
};

const initialState = {
  workflowId: null as string | null,
  workflowName: '未命名工作流',
  workflowDescription: '',
  currentVersionNumber: 1,
  isDirty: false,
  nodes: [] as WorkflowNode[],
  edges: [] as WorkflowEdge[],
  selectedNodeId: null as string | null,
  selectedEdgeId: null as string | null,
  rightPanel: 'properties' as RightPanel,
  isNodeLibraryCollapsed: false,
  contextMenu: initialContextMenu,
  versions: [] as WorkflowVersion[],
  currentVersionId: null as string | null,
  validationIssues: [] as ValidationIssue[],
  history: [] as HistorySnapshot[],
  historyIndex: -1,
  maxHistoryLength: 50,
  isLoading: false,
  isSaving: false,
  lastSavedAt: null as string | null,
  executionId: null as string | null,
  executionStatus: 'idle' as WorkflowEditorState['executionStatus'],
};

function cloneSnapshot(nodes: WorkflowNode[], edges: WorkflowEdge[]): HistorySnapshot {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)) as WorkflowNode[],
    edges: JSON.parse(JSON.stringify(edges)) as WorkflowEdge[],
  };
}

export const useWorkflowEditorStore = create<WorkflowEditorState>((set, get) => ({
  ...initialState,

  setWorkflowMeta: (id, name, desc, version) =>
    set({
      workflowId: id,
      workflowName: name,
      workflowDescription: desc ?? get().workflowDescription,
      currentVersionNumber: version ?? get().currentVersionNumber,
    }),

  setDirty: (dirty) => set({ isDirty: dirty }),

  setNodes: (nodes) => set({ nodes }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[],
      isDirty: true,
    });
  },

  addNode: (node) => {
    const { nodes } = get();
    if (node.type === 'start' && nodes.some((n) => n.type === 'start')) {
      return;
    }
    set({ nodes: [...nodes, node], isDirty: true });
  },

  addNodeByType: (type, position) => {
    get().addNode(createWorkflowNode(type, position));
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
      isDirty: true,
    });
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } }
          : n,
      ),
      isDirty: true,
    });
  },

  removeNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (node?.type === 'start') return;
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      isDirty: true,
    });
  },

  duplicateNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node || node.type === 'start') return;
    const newNode: WorkflowNode = {
      ...JSON.parse(JSON.stringify(node)),
      id: `${node.type}_${Date.now()}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: {
        ...node.data,
        label: `${node.data.label} (副本)`,
      },
    };
    get().addNode(newNode);
  },

  setEdges: (edges) => set({ edges }),

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  onConnect: (connection) => {
    if (connection.source === connection.target) return;
    set({
      edges: addEdge(
        {
          ...connection,
          id: `edge_${connection.source}_${connection.target}_${Date.now()}`,
          type: 'smoothstep',
        },
        get().edges,
      ),
      isDirty: true,
    });
  },

  removeEdge: (edgeId) => {
    set({
      edges: get().edges.filter((e) => e.id !== edgeId),
      selectedEdgeId: get().selectedEdgeId === edgeId ? null : get().selectedEdgeId,
      isDirty: true,
    });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),
  setRightPanel: (panel) => set({ rightPanel: panel }),
  toggleNodeLibrary: () => set({ isNodeLibraryCollapsed: !get().isNodeLibraryCollapsed }),

  pushHistory: () => {
    const { nodes, edges, history, historyIndex, maxHistoryLength } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneSnapshot(nodes, edges));
    if (newHistory.length > maxHistoryLength) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const snapshot = history[newIndex];
    set({
      historyIndex: newIndex,
      nodes: cloneSnapshot(snapshot.nodes, snapshot.edges).nodes,
      edges: cloneSnapshot(snapshot.nodes, snapshot.edges).edges,
      isDirty: true,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const snapshot = history[newIndex];
    set({
      historyIndex: newIndex,
      nodes: cloneSnapshot(snapshot.nodes, snapshot.edges).nodes,
      edges: cloneSnapshot(snapshot.nodes, snapshot.edges).edges,
      isDirty: true,
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  setVersions: (versions) => set({ versions }),
  setCurrentVersionId: (versionId) => set({ currentVersionId: versionId }),
  setCurrentVersionNumber: (version) => set({ currentVersionNumber: version }),

  runValidation: () => {
    const issues = validateWorkflow(get().nodes, get().edges);
    set({ validationIssues: issues });
    return issues;
  },

  setValidationIssues: (issues) => set({ validationIssues: issues }),
  clearValidationIssues: () => set({ validationIssues: [] }),

  setExecutionId: (id) => set({ executionId: id }),
  setExecutionStatus: (status) => set({ executionStatus: status }),

  updateNodeExecutionStatus: (nodeId, status, result) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                executionStatus: status,
                executionResult: result,
              },
            }
          : n,
      ),
    });
  },

  openContextMenu: (x, y, nodeId = null, edgeId = null) =>
    set({
      contextMenu: { open: true, x, y, targetNodeId: nodeId, targetEdgeId: edgeId },
    }),

  closeContextMenu: () => set({ contextMenu: initialContextMenu }),

  applyAutoLayout: () => {
    const { nodes, edges } = get();
    const { nodes: layouted } = autoLayout(nodes, edges);
    set({ nodes: layouted, isDirty: true });
  },

  loadFromWorkflow: (id, name, description, nodes, edges, version) => {
    const snapshot = cloneSnapshot(nodes, edges);
    set({
      ...initialState,
      workflowId: id,
      workflowName: name,
      workflowDescription: description,
      currentVersionNumber: version ?? 1,
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      history: [snapshot],
      historyIndex: 0,
      isDirty: false,
    });
  },

  markSaved: (savedAt, version) =>
    set({
      isDirty: false,
      isSaving: false,
      lastSavedAt: savedAt ?? new Date().toISOString(),
      currentVersionNumber: version ?? get().currentVersionNumber,
    }),

  reset: () => set({ ...initialState, contextMenu: initialContextMenu }),
}));
