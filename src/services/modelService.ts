import http from '@/lib/axios';
import { asArray, pickList, pickObject } from '@/lib/arrayUtils';
import { encryptOptional } from '@/lib/transportCrypto';
import type {
  CreateSupplierRequest,
  EnabledModel,
  EnabledModelsResponse,
  ModelInfo,
  ModelSupplier,
  SupplierListResponse,
  SupplierStatus,
  SupplierType,
  UpdateSupplierRequest,
  UsageRecord,
  UsageResponse,
  UsageSummary,
} from '@/types';

function toCreatePayload(data: CreateSupplierRequest) {
  return {
    provider_name: data.name,
    provider_type: data.type,
    api_key: data.api_key,
    base_url: data.base_url,
  };
}

function toUpdatePayload(data: UpdateSupplierRequest) {
  return {
    ...(data.name !== undefined ? { provider_name: data.name } : {}),
    ...(data.api_key !== undefined ? { api_key: data.api_key } : {}),
    ...(data.base_url !== undefined ? { base_url: data.base_url } : {}),
  };
}

function normalizeModel(raw: Record<string, unknown>, supplierId = ''): ModelInfo {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? raw.model_name ?? ''),
    supplier_id: String(raw.supplier_id ?? raw.provider_id ?? supplierId),
    input_price_per_million: Number(raw.input_price_per_million ?? raw.input_price ?? 0),
    output_price_per_million: Number(raw.output_price_per_million ?? raw.output_price ?? 0),
    is_enabled: Boolean(raw.is_enabled ?? raw.enabled ?? true),
    is_default: Boolean(raw.is_default ?? raw.default ?? false),
    context_window: Number(raw.context_window ?? 0),
  };
}

function normalizeSupplier(raw: Record<string, unknown>): ModelSupplier {
  const id = String(raw.id ?? '');
  const type = String(raw.type ?? raw.provider_type ?? 'custom') as SupplierType;
  return {
    id,
    type: (['openai', 'anthropic', 'google', 'custom'] as SupplierType[]).includes(type)
      ? type
      : 'custom',
    name: String(raw.name ?? raw.provider_name ?? ''),
    api_key_masked: String(raw.api_key_masked ?? raw.api_key_mask ?? '****'),
    base_url: (raw.base_url as string | null | undefined) ?? null,
    status: (raw.status === 'disabled' ? 'disabled' : 'active') as SupplierStatus,
    models: asArray<Record<string, unknown>>(raw.models).map((m) => normalizeModel(m, id)),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
  };
}

export const modelService = {
  getSuppliers: async (): Promise<SupplierListResponse> => {
    const res = await http.get('/models/providers');
    const list = pickList<Record<string, unknown>>(res, [
      'suppliers',
      'providers',
      'items',
      'results',
    ]);
    return { suppliers: list.map(normalizeSupplier) };
  },

  createSupplier: async (data: CreateSupplierRequest): Promise<ModelSupplier> => {
    const api_key = (await encryptOptional(data.api_key)) ?? data.api_key;
    const res = await http.post('/models/providers', toCreatePayload({ ...data, api_key }));
    return normalizeSupplier((res ?? {}) as unknown as Record<string, unknown>);
  },

  updateSupplier: async (id: string, data: UpdateSupplierRequest): Promise<ModelSupplier> => {
    const encrypted = data.api_key
      ? { ...data, api_key: await encryptOptional(data.api_key) }
      : data;
    const res = await http.put(`/models/providers/${id}`, toUpdatePayload(encrypted));
    return normalizeSupplier((res ?? { id }) as unknown as Record<string, unknown>);
  },

  deleteSupplier: (id: string): Promise<void> => http.delete(`/models/providers/${id}`),

  toggleSupplierStatus: async (id: string, _status: SupplierStatus): Promise<ModelSupplier> => {
    const res = await http.post(`/models/providers/${id}/toggle`);
    return normalizeSupplier((res ?? { id }) as unknown as Record<string, unknown>);
  },

  setDefaultModel: (modelId: string): Promise<void> =>
    http.post(`/models/${modelId}/set-default`),

  getUsage: async (params?: {
    start_date?: string;
    end_date?: string;
    model_id?: string;
  }): Promise<UsageResponse> => {
    const res = await http.get('/models/usage', { params });
    const records = pickList<UsageRecord>(res, ['records', 'items', 'usage']);
    const summary = pickObject<UsageSummary>(
      res && typeof res === 'object' ? (res as { summary?: unknown }).summary : null,
      {
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_cost: 0,
      },
    );
    return { records, summary };
  },

  getEnabledModels: async (): Promise<EnabledModelsResponse> => {
    const res = await http.get('/models/enabled');
    return {
      models: pickList<EnabledModel>(res, ['models', 'items', 'results']),
    };
  },
};
