import http from '@/lib/axios';
import { encryptOptional } from '@/lib/transportCrypto';
import type {
  CreateSupplierRequest,
  EnabledModelsResponse,
  ModelSupplier,
  SupplierListResponse,
  SupplierStatus,
  UpdateSupplierRequest,
  UsageResponse,
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

export const modelService = {
  getSuppliers: (): Promise<SupplierListResponse> => http.get('/models/providers'),

  createSupplier: async (data: CreateSupplierRequest): Promise<ModelSupplier> => {
    const api_key = (await encryptOptional(data.api_key)) ?? data.api_key;
    return http.post('/models/providers', toCreatePayload({ ...data, api_key }));
  },

  updateSupplier: async (id: string, data: UpdateSupplierRequest): Promise<ModelSupplier> => {
    const encrypted = data.api_key
      ? { ...data, api_key: await encryptOptional(data.api_key) }
      : data;
    return http.put(`/models/providers/${id}`, toUpdatePayload(encrypted));
  },

  deleteSupplier: (id: string): Promise<void> => http.delete(`/models/providers/${id}`),

  toggleSupplierStatus: (id: string, _status: SupplierStatus): Promise<ModelSupplier> =>
    http.post(`/models/providers/${id}/toggle`),

  setDefaultModel: (modelId: string): Promise<void> =>
    http.post(`/models/${modelId}/set-default`),

  getUsage: (params?: {
    start_date?: string;
    end_date?: string;
    model_id?: string;
  }): Promise<UsageResponse> => http.get('/models/usage', { params }),

  getEnabledModels: (): Promise<EnabledModelsResponse> => http.get('/models/enabled'),
};
