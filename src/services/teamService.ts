import http from '@/lib/axios';
import type {
  JoinTeamRequest,
  JoinTeamResponse,
  ResetInviteCodeResponse,
  TeamInfoResponse,
  TeamMembersResponse,
} from '@/types';

export const teamService = {
  joinTeam: (data: JoinTeamRequest): Promise<JoinTeamResponse> => http.post('/teams/join', data),

  /** Backend has no dedicated /teams/info; members payload may include team meta. */
  getTeamInfo: async (): Promise<TeamInfoResponse> => {
    const res = (await http.get('/teams/members')) as TeamMembersResponse &
      Partial<TeamInfoResponse> & {
        team_id?: string;
        team_name?: string;
        invite_code?: string;
      };

    if (res.team) {
      return { team: res.team, invite_code: res.invite_code ?? '' };
    }

    return {
      team: {
        id: res.team_id ?? '',
        name: res.team_name ?? '我的团队',
        owner_id: '',
        owner_name: '',
        member_count: res.members?.length ?? 0,
        created_at: '',
      },
      invite_code: res.invite_code ?? '',
    };
  },

  getMembers: (): Promise<TeamMembersResponse> => http.get('/teams/members'),

  removeMember: (memberId: string): Promise<{ message: string }> =>
    http.delete(`/teams/members/${memberId}`),

  resetInviteCode: (): Promise<ResetInviteCodeResponse> =>
    http.post('/teams/invite-code/reset'),
};
