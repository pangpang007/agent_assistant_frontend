/** Phase 7 — Dashboard / API publish / global search */

export interface DashboardStats {
  workflowCount: number;
  agentCount: number;
  knowledgeBaseCount: number;
  monthlyExecutions: number;
  successRate: number;
}

export interface TokenTrendItem {
  date: string;
  label: string;
  tokens: number;
}

export interface PublishedApi {
  id: string;
  workflowId: string;
  workflowName: string;
  endpoint: string;
  apiKeyMasked: string;
  callCount: number;
  successRate: number;
  avgDurationMs: number;
  enabled: boolean;
  createdAt: string;
}

export interface PublishResult {
  endpoint: string;
  apiKey: string;
  id?: string;
}

export type SearchResultType = 'workflow' | 'agent' | 'knowledge' | 'template' | 'tool';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
}

export interface SearchGroup {
  type: SearchResultType | string;
  label?: string;
  items: SearchResult[];
}
