import http from '@/lib/axios';
import type {
  CreateSupplierRequest,
  EnabledModelsResponse,
  ModelSupplier,
  SupplierListResponse,
  SupplierStatus,
  UpdateSupplierRequest,
  UsageResponse,
} from '@/types';

export const modelService = {
  getSuppliers: (): Promise<SupplierListResponse> => http.get('/models/providers'),

  createSupplier: (data: CreateSupplierRequest): Promise<ModelSupplier> =>
    http.post('/models/providers', data),

  updateSupplier: (id: string, data: UpdateSupplierRequest): Promise<ModelSupplier> =>
    http.put(`/models/providers/${id}`, data),

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
