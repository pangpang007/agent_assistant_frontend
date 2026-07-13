export type SupplierType = 'openai' | 'anthropic' | 'google' | 'custom';
export type SupplierStatus = 'active' | 'disabled';

export interface ModelInfo {
  id: string;
  name: string;
  supplier_id: string;
  input_price_per_million: number;
  output_price_per_million: number;
  is_enabled: boolean;
  is_default: boolean;
  context_window: number;
}

export interface CreateSupplierRequest {
  type: SupplierType;
  name: string;
  api_key: string;
  base_url?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  status?: SupplierStatus;
}

export interface ModelSupplier {
  id: string;
  type: SupplierType;
  name: string;
  api_key_masked: string;
  base_url: string | null;
  status: SupplierStatus;
  models: ModelInfo[];
  created_at: string;
  updated_at: string;
}

export interface SupplierListResponse {
  suppliers: ModelSupplier[];
}

export interface UsageRecord {
  date: string;
  model_id: string;
  model_name: string;
  supplier_name: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
}

export interface UsageSummary {
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
}

export interface UsageResponse {
  records: UsageRecord[];
  summary: UsageSummary;
}

export interface EnabledModel {
  id: string;
  name: string;
  supplier_name: string;
}

export interface EnabledModelsResponse {
  models: EnabledModel[];
}
