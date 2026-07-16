import http from '@/lib/axios';
import { encryptSensitive } from '@/lib/transportCrypto';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/types';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse | void> =>
    http.post('/auth/login', {
      ...data,
      password: await encryptSensitive(data.password),
    }),

  register: async (data: RegisterRequest): Promise<RegisterResponse | void> => {
    const { register_type, account_type, ...rest } = data as RegisterRequest & {
      account_type?: string;
    };
    return http.post('/auth/register', {
      ...rest,
      account_type: account_type ?? register_type ?? 'personal',
      password: await encryptSensitive(data.password),
    });
  },

  logout: (): Promise<void> => http.post('/auth/logout'),
};
