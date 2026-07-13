import http from '@/lib/axios';
import { encryptSensitive } from '@/lib/transportCrypto';
import type { UpdatePasswordRequest, UpdateProfileRequest, UserInfo } from '@/types';

export const userService = {
  getProfile: (): Promise<UserInfo> => http.get('/users/profile'),

  updateProfile: (data: UpdateProfileRequest): Promise<UserInfo> =>
    http.patch('/users/profile', data),

  updatePassword: async (data: UpdatePasswordRequest): Promise<{ message: string }> => {
    const oldPassword = data.old_password ?? data.current_password;
    if (!oldPassword) {
      throw new Error('缺少当前密码');
    }

    return http.post('/users/profile/change-password', {
      old_password: await encryptSensitive(oldPassword),
      new_password: await encryptSensitive(data.new_password),
    });
  },

  deleteAccount: (): Promise<void> => http.delete('/users/profile'),
};
