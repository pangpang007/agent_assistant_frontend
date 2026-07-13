export type ToolType = 'preset' | 'custom';
export type AuthType = 'none' | 'api_key' | 'bearer';
export type ToolParameterType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';

export interface ToolParameter {
  name: string;
  type: ToolParameterType;
  required: boolean;
  description: string;
  default_value?: string;
}

export interface CreateToolRequest {
  name: string;
  description: string;
  api_url: string;
  auth_type: AuthType;
  auth_config?: {
    key_name?: string;
    token?: string;
  };
  parameters: ToolParameter[];
  swagger_source?: string;
}

export type UpdateToolRequest = Partial<CreateToolRequest>;

export interface ToolTestRequest {
  params: Record<string, unknown>;
}

export interface ToolTestResponse {
  status: number;
  status_text: string;
  data: unknown;
  duration_ms: number;
  token_usage?: number;
  estimated_cost?: number;
  request_details: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
  };
}

export interface ToolReferenceResponse {
  agent_count: number;
  agents: Array<{ id: string; name: string }>;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  api_url?: string;
  auth_type: AuthType;
  auth_config?: {
    key_name?: string;
  };
  parameters: ToolParameter[];
  agent_count: number;
  created_at: string;
  updated_at: string;
}

export interface ToolListResponse {
  tools: Tool[];
  total: number;
}

export interface SwaggerParseResult {
  name: string;
  description: string;
  api_url: string;
  parameters: ToolParameter[];
}
