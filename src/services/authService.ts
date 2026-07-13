import axios from 'axios';
import http from '@/lib/axios';
import { getApiBaseUrl } from '@/lib/backendConfig';
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

  register: async (data: RegisterRequest): Promise<RegisterResponse> =>
    http.post('/auth/register', {
      ...data,
      password: await encryptSensitive(data.password),
    }),

  refreshToken: (refreshToken: string): Promise<RefreshTokenResponse> =>
    axios
      .post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
      .then((res) => res.data as RefreshTokenResponse),

  logout: (): Promise<void> => http.post('/auth/logout'),
};
