import { create } from 'zustand';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { authStorage } from '@/lib/authStorage';
import type { RegisterRequest, UserInfo } from '@/types';

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<UserInfo>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const accessToken = authStorage.getAccessToken();
      const refreshToken = authStorage.getRefreshToken();
      const cachedUser = authStorage.getUser();

      if (!accessToken || !refreshToken) {
        set({ isLoading: false });
        return;
      }

      if (cachedUser) {
        set({
          user: cachedUser,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      } else {
        set({ accessToken, refreshToken });
      }

      const profile = await userService.getProfile();
      authStorage.setUser(profile);
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch {
      get().clearAuth();
    }
  },

  login: async (email, password) => {
    const response = await authService.login({ email, password });
    if (!response?.access_token || !response?.refresh_token) {
      throw new Error('登录响应缺少 token，请检查后端返回格式');
    }
    authStorage.setTokens(response.access_token, response.refresh_token);
    if (response.user) {
      authStorage.setUser(response.user);
    }
    set({
      user: response.user ?? null,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      isAuthenticated: true,
    });
  },

  register: async (data) => {
    await authService.register(data);
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    get().clearAuth();
    window.location.href = '/login';
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    authStorage.setUser(updated);
    set({ user: updated });
  },

  clearAuth: () => {
    authStorage.clear();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
