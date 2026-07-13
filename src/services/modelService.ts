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

async function withEncryptedApiKey<T extends { api_key?: string }>(data: T): Promise<T> {
  if (!data.api_key) return data;
  return {
    ...data,
    api_key: await encryptOptional(data.api_key),
  };
}

export const modelService = {
  getSuppliers: (): Promise<SupplierListResponse> => http.get('/models/providers'),

  createSupplier: async (data: CreateSupplierRequest): Promise<ModelSupplier> =>
    http.post('/models/providers', await withEncryptedApiKey(data)),

  updateSupplier: async (id: string, data: UpdateSupplierRequest): Promise<ModelSupplier> =>
    http.put(`/models/providers/${id}`, await withEncryptedApiKey(data)),

  deleteSupplier: (id: string): Promise<void> => http.delete(`/models/providers/${id}`),

  toggleSupplierStatus: (id: string, status: SupplierStatus): Promise<ModelSupplier> =>
    http.put(`/models/providers/${id}/status`, { status }),

  setDefaultModel: (modelId: string): Promise<void> =>
    http.put(`/models/${modelId}/default`),

  getUsage: (params?: {
    start_date?: string;
    end_date?: string;
    model_id?: string;
  }): Promise<UsageResponse> => http.get('/models/usage', { params }),

  getEnabledModels: (): Promise<EnabledModelsResponse> => http.get('/models/enabled'),
};
