import type { Node, Edge } from '@xyflow/react';

export type NodeType =
  | 'start'
  | 'end'
  | 'agent'
  | 'knowledgeRetrieval'
  | 'questionClassifier'
  | 'parameterExtractor'
  | 'condition'
  | 'parallel'
  | 'loop'
  | 'review'
  | 'test'
  | 'delay'
  | 'code'
  | 'template'
  | 'variableAggregator'
  | 'httpRequest';

export type NodeExecutionStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'error'
  | 'waiting_review'
  | 'skipped';

export type WorkflowStatus = 'draft' | 'published' | 'archived';

export interface OutputVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any';
  description?: string;
}

export interface WorkflowNodeData {
  label: string;
  nodeType: NodeType;
  config: Record<string, unknown>;
  outputs: OutputVariable[];
  executionStatus?: NodeExecutionStatus;
  executionResult?: unknown;
  executionMeta?: { duration: number; tokens: number };
  [key: string]: unknown;
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export interface ValidationIssue {
  id: string;
  level: 'error' | 'warning';
  nodeId?: string;
  message: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export interface SaveWorkflowRequest {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  note?: string;
}

export interface ValidateWorkflowResponse {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface RunWorkflowRequest {
  inputs: Record<string, unknown>;
}

export interface TestNodeRequest {
  nodeId: string;
  inputs: Record<string, unknown>;
}

export interface TestNodeResponse {
  success: boolean;
  outputs: Record<string, unknown>;
  duration: number;
  tokenUsage?: number;
  cost?: number;
  error?: string;
}

export interface WorkflowListParams {
  search?: string;
  sort_by?: 'name' | 'updated_at' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  current_version: number;
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkflowListItem {
  id: string;
  name: string;
  description: string;
  node_count: number;
  edge_count?: number;
  current_version: number;
  status: WorkflowStatus;
  last_run_at?: string;
  last_run_status?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowVersion {
  id: string;
  version: number;
  label?: string;
  note?: string;
  node_count: number;
  edge_count: number;
  created_at: string;
  created_by: string;
}

export interface WorkflowListResponse {
  workflows: WorkflowListItem[];
  total: number;
}

export interface SaveWorkflowResponse {
  version: WorkflowVersion;
}

export interface RunWorkflowResponse {
  executionId: string;
}

export interface AvailableVariable {
  nodeId: string;
  nodeLabel: string;
  variableName: string;
  variableType: string;
  fullRef: string;
}
