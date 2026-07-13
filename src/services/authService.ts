import axios from 'axios';
import http from '@/lib/axios';
import { getApiBaseUrl } from '@/lib/backendConfig';
import { unwrapApiData } from '@/lib/apiEnvelope';
import { encryptSensitive } from '@/lib/transportCrypto';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
} from '@/types';

const BASE_URL = getApiBaseUrl();

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> =>
    http.post('/auth/login', {
      ...data,
      password: await encryptSensitive(data.password),
    }),

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const { register_type, account_type, ...rest } = data as RegisterRequest & {
      account_type?: string;
    };
    return http.post('/auth/register', {
      ...rest,
      account_type: account_type ?? register_type ?? 'personal',
      password: await encryptSensitive(data.password),
    });
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    return unwrapApiData<RefreshTokenResponse>(response.data);
  },

  logout: (): Promise<void> => http.post('/auth/logout'),
};
