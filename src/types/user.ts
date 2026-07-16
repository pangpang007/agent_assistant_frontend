export type UserRole = 'personal' | 'team_owner' | 'team_member';
export type UserType = 'personal' | 'team';
export type RegisterType = 'personal' | 'team';

export interface UserInfo {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  user_type: UserType;
  role: UserRole;
  team_id: string | null;
  team_name: string | null;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  /** @deprecated use account_type — kept for UI compatibility */
  register_type?: RegisterType;
  account_type?: RegisterType;
  team_name?: string;
}

/** Cookie 鉴权后 token 字段可选（过渡期后端仍可能返回）。 */
export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: 'bearer' | string;
  user?: UserInfo;
}

export interface RegisterResponse {
  message?: string;
  user?: UserInfo;
}

/** @deprecated Cookie 模式下由后端自动续期，前端不再调用 refresh */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface UpdateProfileRequest {
  username: string;
}

export interface UpdatePasswordRequest {
  /** Preferred field name (transport encryption API) */
  old_password?: string;
  /** Legacy Phase 1 field name */
  current_password?: string;
  new_password: string;
}
