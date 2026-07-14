import type { Agent, KnowledgeBase, ModelSupplier, Tool, Workflow, WorkflowListItem } from '@/types';

export const mockAgent: Agent = {
  id: 'agent-1',
  name: '前端工程师',
  description: '擅长前端',
  system_prompt: '你是前端工程师',
  model_id: 'model-1',
  model_name: 'gpt-4o',
  tool_ids: [],
  tool_count: 0,
  knowledge_base_ids: [],
  memory_strategy: 'window',
  output_format: 'text',
  temperature: 0.7,
  max_tokens: 2048,
  type: 'preset',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockTool: Tool = {
  id: 'tool-1',
  name: '天气查询',
  description: '查询天气',
  type: 'custom',
  api_url: 'https://api.example.com/weather',
  auth_type: 'none',
  parameters: [
    {
      name: 'city',
      type: 'string',
      description: '城市',
      required: true,
    },
  ],
  agent_count: 0,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockKnowledgeBase: KnowledgeBase = {
  id: 'kb-1',
  name: '产品文档',
  description: '产品相关文档',
  document_count: 0,
  total_size: 0,
  chunk_size: 500,
  chunk_overlap: 50,
  embedding_model: 'text-embedding-3-small',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockSupplier: ModelSupplier = {
  id: 'supplier-1',
  type: 'openai',
  name: 'OpenAI',
  api_key_masked: 'sk-****',
  base_url: null,
  status: 'active',
  models: [
    {
      id: 'model-1',
      name: 'gpt-4o',
      supplier_id: 'supplier-1',
      input_price_per_million: 2.5,
      output_price_per_million: 10,
      is_enabled: true,
      is_default: true,
      context_window: 128000,
    },
  ],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockWorkflowItem: WorkflowListItem = {
  id: 'wf-1',
  name: '示例工作流',
  description: '描述',
  node_count: 2,
  edge_count: 1,
  current_version: 1,
  status: 'draft',
  updated_at: '2025-01-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
};

export const mockWorkflow: Workflow = {
  id: 'wf-1',
  name: '示例工作流',
  description: '描述',
  nodes: [],
  edges: [],
  current_version: 1,
  status: 'draft',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};
