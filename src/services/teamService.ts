import http from '@/lib/axios';
import { pickList } from '@/lib/arrayUtils';
import type {
  JoinTeamRequest,
  JoinTeamResponse,
  ResetInviteCodeResponse,
  TeamInfoResponse,
  TeamMember,
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

    const members = pickList<TeamMember>(res, ['members', 'items', 'results']);

    if (res.team) {
      return { team: res.team, invite_code: res.invite_code ?? '' };
    }

    return {
      team: {
        id: res.team_id ?? '',
        name: res.team_name ?? '我的团队',
        owner_id: '',
        owner_name: '',
        member_count: members.length,
        created_at: '',
      },
      invite_code: res.invite_code ?? '',
    };
  },

  getMembers: async (): Promise<TeamMembersResponse> => {
    const res = await http.get('/teams/members');
    return { members: pickList<TeamMember>(res, ['members', 'items', 'results']) };
  },

  removeMember: (memberId: string): Promise<{ message: string }> =>
    http.delete(`/teams/members/${memberId}`),

  resetInviteCode: (): Promise<ResetInviteCodeResponse> =>
    http.post('/teams/invite-code/reset'),
};
