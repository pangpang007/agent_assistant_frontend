/** Phase 6 — templates, versions enhancement, execution history, logs, env vars */

import type { WorkflowEdge, WorkflowNode } from './workflow';

// ==================== 模板 ====================

export type TemplateCategory =
  | 'full_pipeline'
  | 'code_review'
  | 'doc_generation'
  | 'research'
  | 'custom';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags?: string[];
  thumbnail_url: string | null;
  use_count: number;
  is_official: boolean;
  source_workflow_id: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  created_at: string;
  updated_at: string;
}

export interface SaveAsTemplateRequest {
  workflow_id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
}

export interface GetTemplatesParams {
  category?: string;
  is_official?: boolean;
  keyword?: string;
  page?: number;
  page_size?: number;
}

// ==================== 版本（增强） ====================

export interface VersionRecord {
  id: string;
  workflow_id: string;
  version_number: number;
  tag: string | null;
  nodes_json?: string;
  edges_json?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  node_count?: number;
  edge_count?: number;
  note?: string;
  created_at: string;
  created_by: string;
}

export interface DiffNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
}

export interface ModifiedDiffNode {
  id: string;
  type: string;
  label: string;
  changed_fields: string[];
}

export interface DiffEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface VersionDiff {
  added_nodes: DiffNode[];
  removed_nodes: DiffNode[];
  modified_nodes: ModifiedDiffNode[];
  added_edges: DiffEdge[];
  removed_edges: DiffEdge[];
}

// ==================== 执行历史 ====================

export type HistoryExecutionStatus = 'success' | 'failed' | 'cancelled' | 'running';

export interface HistoryExecution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  version_number: number;
  status: HistoryExecutionStatus;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  total_duration_ms: number | null;
  total_tokens: number | null;
  total_cost: number | null;
  started_at: string;
  finished_at: string | null;
  trigger_type: 'manual' | 'api';
}

export interface HistoryNodeResult {
  id: string;
  execution_id: string;
  node_id: string;
  node_name: string;
  node_type: string;
  status: 'success' | 'failed' | 'skipped' | 'running' | 'waiting';
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  duration_ms: number | null;
  tokens_used: number | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface HistoryExecutionLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  node_id: string | null;
  node_name: string | null;
  metadata?: Record<string, unknown>;
}

export interface HistoryExecutionDetail extends HistoryExecution {
  nodes: HistoryNodeResult[];
  logs: HistoryExecutionLog[];
  snapshot_nodes?: WorkflowNode[];
  snapshot_edges?: WorkflowEdge[];
}

export interface GetHistoryExecutionsParams {
  workflow_id?: string;
  status?: string;
  trigger_type?: string;
  start_time?: string;
  end_time?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}

// ==================== 日志中心 ====================

export type CenterLogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface CenterLogEntry {
  id: string;
  execution_id: string;
  workflow_id: string;
  workflow_name: string;
  node_id: string | null;
  node_name: string | null;
  level: CenterLogLevel;
  message: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export interface CenterLogFilter {
  execution_id?: string;
  level?: CenterLogLevel;
  workflow_id?: string;
  start_time?: string;
  end_time?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}

// ==================== 环境变量 ====================

export type EnvVarType = 'string' | 'secret';

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  type: EnvVarType;
  created_at: string;
  updated_at: string;
}

export interface EnvVarFormValues {
  key: string;
  value: string;
  type: EnvVarType;
}

// ==================== 分页 ====================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
