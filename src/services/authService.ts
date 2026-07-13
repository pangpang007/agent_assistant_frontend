import axios from 'axios';
import http from '@/lib/axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const authService = {
  login: (data: LoginRequest): Promise<LoginResponse> => http.post('/auth/login', data),

  register: (data: RegisterRequest): Promise<RegisterResponse> =>
    http.post('/auth/register', data),

  refreshToken: (refreshToken: string): Promise<RefreshTokenResponse> =>
    axios
      .post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
      .then((res) => res.data as RefreshTokenResponse),

  logout: (): Promise<void> => http.post('/auth/logout'),
};
