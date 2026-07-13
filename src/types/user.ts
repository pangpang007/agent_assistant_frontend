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
  register_type: RegisterType;
  team_name?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  user: UserInfo;
}

export interface RegisterResponse {
  message: string;
  user: UserInfo;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface UpdateProfileRequest {
  username: string;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}
