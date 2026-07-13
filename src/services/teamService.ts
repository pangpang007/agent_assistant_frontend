import http from '@/lib/axios';
import type {
  JoinTeamRequest,
  JoinTeamResponse,
  ResetInviteCodeResponse,
  TeamInfoResponse,
  TeamMembersResponse,
} from '@/types';

export const teamService = {
  joinTeam: (data: JoinTeamRequest): Promise<JoinTeamResponse> => http.post('/team/join', data),

  getTeamInfo: (): Promise<TeamInfoResponse> => http.get('/team/info'),

  getMembers: (): Promise<TeamMembersResponse> => http.get('/team/members'),

  removeMember: (memberId: string): Promise<{ message: string }> =>
    http.delete(`/team/members/${memberId}`),

  resetInviteCode: (): Promise<ResetInviteCodeResponse> =>
    http.post('/team/invite-code/reset'),
};
