import http from '@/lib/axios';
import type { UpdatePasswordRequest, UpdateProfileRequest, UserInfo } from '@/types';

export const userService = {
  getProfile: (): Promise<UserInfo> => http.get('/user/profile'),

  updateProfile: (data: UpdateProfileRequest): Promise<UserInfo> =>
    http.put('/user/profile', data),

  updatePassword: (data: UpdatePasswordRequest): Promise<{ message: string }> =>
    http.put('/user/password', data),

  deleteAccount: (): Promise<void> => http.delete('/user/account'),
};
