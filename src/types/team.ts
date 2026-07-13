export interface TeamInfo {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string;
  member_count: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface JoinTeamRequest {
  invite_code: string;
}

export interface JoinTeamResponse {
  message: string;
  team: TeamInfo;
}

export interface TeamInfoResponse {
  team: TeamInfo;
  invite_code: string;
}

export interface ResetInviteCodeResponse {
  invite_code: string;
}

export interface TeamMembersResponse {
  members: TeamMember[];
}
