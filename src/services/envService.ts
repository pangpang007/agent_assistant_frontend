import http from '@/lib/axios';
import { asArray, pickList } from '@/lib/arrayUtils';
import { encryptOptional } from '@/lib/transportCrypto';
import type { EnvVarFormValues, EnvVariable } from '@/types/phase6';

export const envService = {
  getEnvVars: async (): Promise<EnvVariable[]> => {
    const res = await http.get('/env-vars');
    return pickList<EnvVariable>(res, ['data', 'items', 'results', 'env_vars']);
  },

  createEnvVar: async (values: EnvVarFormValues): Promise<EnvVariable> => {
    const value =
      values.type === 'secret' ? ((await encryptOptional(values.value)) ?? values.value) : values.value;
    return http.post('/env-vars', { ...values, value });
  },

  updateEnvVar: async (id: string, values: Partial<EnvVarFormValues>): Promise<EnvVariable> => {
    const payload = { ...values };
    if (values.value !== undefined && values.type === 'secret') {
      payload.value = (await encryptOptional(values.value)) ?? values.value;
    }
    return http.put(`/env-vars/${id}`, payload);
  },

  deleteEnvVar: (id: string): Promise<void> => http.delete(`/env-vars/${id}`),
};

export function emptyEnvVars(): EnvVariable[] {
  return asArray([]);
}
