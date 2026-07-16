import { create } from 'zustand';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { clearLegacyAuthStorage } from '@/lib/authStorage';
import type { RegisterRequest, UserInfo } from '@/types';

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Whether the initial Cookie auth check has finished. */
  initialized: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  /** App startup: validate session via Cookie. Does not redirect on 401. */
  checkAuth: () => Promise<boolean>;
  updateUser: (user: Partial<UserInfo>) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  initialized: false,

  login: async (email, password) => {
    await authService.login({ email, password });
    // Backend sets HttpOnly Cookie via Set-Cookie; then load profile
    await get().fetchProfile();
  },

  register: async (data) => {
    await authService.register(data);
    // Prefer auto-login when backend Set-Cookie on register; otherwise stay logged out
    try {
      await get().fetchProfile();
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        initialized: true,
      });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      console.warn('[Auth] 登出接口调用失败，仍然清除本地状态');
    } finally {
      get().reset();
      window.location.href = '/login';
    }
  },

  fetchProfile: async () => {
    const profile = await userService.getProfile();
    set({
      user: profile,
      isAuthenticated: true,
      initialized: true,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    clearLegacyAuthStorage();
    set({ isLoading: true });
    try {
      // X-Auth-Check: axios interceptor must not redirect on 401 during boot
      const profile = await userService.getProfileForAuthCheck();
      set({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        initialized: true,
      });
      return true;
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initialized: true,
      });
      return false;
    }
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...partial } });
  },

  reset: () => {
    clearLegacyAuthStorage();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: true,
    });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().reset();
  });
}
