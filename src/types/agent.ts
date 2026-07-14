export type MemoryStrategy = 'none' | 'window' | 'summary';
export type OutputFormat = 'markdown' | 'json' | 'text';
export type AgentType = 'preset' | 'custom';

export interface CreateAgentRequest {
  name: string;
  description: string;
  system_prompt: string;
  model_id: string;
  tool_ids: string[];
  knowledge_base_ids: string[];
  memory_strategy: MemoryStrategy;
  output_format: OutputFormat;
  temperature: number;
  max_tokens: number;
}

export type UpdateAgentRequest = Partial<CreateAgentRequest>;

export interface AgentListParams {
  type?: AgentType;
  search?: string;
  sort_by?: 'name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  model_id: string;
  model_name: string;
  tool_ids: string[];
  tool_count: number;
  knowledge_base_ids: string[];
  memory_strategy: MemoryStrategy;
  output_format: OutputFormat;
  temperature: number;
  max_tokens: number;
  type: AgentType;
  created_at: string;
  updated_at: string;
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
}
