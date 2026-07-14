import { useCallback, useEffect, useState } from 'react';
import { Copy, RefreshCw, Users } from 'lucide-react';
import { InviteCodeInput } from '@/components/auth';
import { MemberListItem } from '@/components/team';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { teamService } from '@/services/teamService';
import { userService } from '@/services/userService';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/validation';
import type { TeamInfo, TeamMember } from '@/types';
import '@/pages/Auth/AuthPages.css';

export default function TeamSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { success, error: toastError } = useToast();

  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteError, setInviteError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isResettingCode, setIsResettingCode] = useState(false);
  const [resetCodeModalOpen, setResetCodeModalOpen] = useState(false);
  const [removeModal, setRemoveModal] = useState<{
    open: boolean;
    memberId: string | null;
    memberName: string;
  }>({ open: false, memberId: null, memberName: '' });
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const loadTeamData = useCallback(async () => {
    if (!user?.team_id) return;
    setIsLoading(true);
    try {
      const [infoRes, membersRes] = await Promise.all([
        teamService.getTeamInfo(),
        teamService.getMembers(),
      ]);
      setTeamInfo(infoRes.team);
      setInviteCode(infoRes.invite_code);
      setMembers(membersRes.members ?? []);
    } catch (err) {
      toastError(getApiErrorMessage(err, '加载团队信息失败'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.team_id, toastError]);

  useEffect(() => {
    if (!user?.team_id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch team data when membership changes
    void loadTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when team membership changes
  }, [user?.team_id]);

  if (!user) return null;

  const handleJoinTeam = async () => {
    if (!inviteCodeInput.trim()) return;
    setIsJoining(true);
    setInviteError(undefined);
    try {
      const res = await teamService.joinTeam({ invite_code: inviteCodeInput.trim() });
      success(`成功加入团队：${res.team.name}`);
      const profile = await userService.getProfile();
      updateUser(profile);
    } catch {
      const msg = '邀请码不存在或已过期';
      setInviteError(msg);
      toastError(msg);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      success('邀请码已复制到剪贴板');
    } catch {
      toastError('复制失败，请手动复制');
    }
  };

  const handleResetInviteCode = async () => {
    setIsResettingCode(true);
    try {
      const res = await teamService.resetInviteCode();
      setInviteCode(res.invite_code);
      success('邀请码已重置，旧邀请码已失效');
      setResetCodeModalOpen(false);
    } catch (err) {
      toastError(getApiErrorMessage(err, '重置失败'));
    } finally {
      setIsResettingCode(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeModal.memberId) return;
    setIsRemovingMember(true);
    try {
      await teamService.removeMember(removeModal.memberId);
      success(`已移除成员：${removeModal.memberName}`);
      setRemoveModal({ open: false, memberId: null, memberName: '' });
      await loadTeamData();
    } catch (err) {
      if (getApiErrorStatus(err) === 404 || getApiErrorStatus(err) === 409) {
        toastError('数据已变更，请刷新页面');
        await loadTeamData();
      } else {
        toastError(getApiErrorMessage(err, '移除失败'));
      }
    } finally {
      setIsRemovingMember(false);
    }
  };

  const renderJoinView = () => (
    <Card padding="md">
      <h3 className="settings-page__card-title">加入团队</h3>
      <p className="settings-page__card-desc">
        输入团队邀请码，加入已有团队。加入后你可以与团队成员共享工作流和 Agent。
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <InviteCodeInput
            value={inviteCodeInput}
            onChange={setInviteCodeInput}
            error={inviteError}
            disabled={isJoining}
          />
        </div>
        <Button
          variant="primary"
          size="md"
          loading={isJoining}
          disabled={!inviteCodeInput.trim() || isJoining}
          onClick={handleJoinTeam}
        >
          加入
        </Button>
      </div>
    </Card>
  );

  const renderTeamInfoCard = () => (
    <Card padding="md">
      <div className="settings-page__info-grid">
        <div className="settings-page__info-item">
          <label>团队名称</label>
          <span>{teamInfo?.name ?? user.team_name ?? '—'}</span>
        </div>
        <div className="settings-page__info-item">
          <label>你的角色</label>
          <span>
            {user.role === 'team_owner' ? 'Owner' : user.role === 'team_member' ? 'Member' : 'Personal'}
          </span>
        </div>
        <div className="settings-page__info-item">
          <label>成员数</label>
          <span>{teamInfo?.member_count ?? members.length} 人</span>
        </div>
        {user.role === 'team_member' && teamInfo && (
          <div className="settings-page__info-item">
            <label>团队创建者</label>
            <span>{teamInfo.owner_name}</span>
          </div>
        )}
      </div>
    </Card>
  );

  const renderOwnerView = () => (
    <>
      {renderTeamInfoCard()}
      <Card padding="md" className="settings-page__section">
        <h3 className="settings-page__card-title">邀请码</h3>
        <p className="settings-page__card-desc">分享邀请码以邀请新成员加入团队</p>
        <div className="settings-page__invite-row">
          <code className="settings-page__invite-code">{inviteCode || '—'}</code>
          <Button variant="secondary" size="sm" onClick={handleCopyInviteCode} disabled={!inviteCode}>
            <Copy size={16} /> 复制
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setResetCodeModalOpen(true)}>
            <RefreshCw size={16} /> 重置
          </Button>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-3)' }}>
          邀请码有效期：永久
        </p>
      </Card>
      <Card padding="md" className="settings-page__section">
        <div className="settings-page__card-title-row">
          <h3 className="settings-page__card-title">成员</h3>
          <Tag color="default">{members.length} 人</Tag>
        </div>
        {members.length === 0 ? (
          <EmptyState
            icon={<Users size={48} strokeWidth={1.5} />}
            title="暂无成员"
            description="邀请团队成员开始协作"
          />
        ) : (
          members.map((member, index) => (
            <MemberListItem
              key={member.id}
              member={member}
              isCurrentUser={member.user_id === user.id}
              isOwner
              isLast={index === members.length - 1}
              onRemove={(id) => {
                const m = members.find((item) => item.id === id);
                setRemoveModal({ open: true, memberId: id, memberName: m?.username ?? '' });
              }}
            />
          ))
        )}
      </Card>
    </>
  );

  const renderMemberView = () => (
    <>
      {renderTeamInfoCard()}
      <p style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        如需退出团队，请联系团队管理员或删除你的账户。
      </p>
    </>
  );

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h1 className="settings-page__title">团队管理</h1>
        <p className="settings-page__desc">加入团队或管理你的团队</p>
      </header>

      {isLoading && user.team_id ? (
        <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
      ) : user.role === 'personal' && !user.team_id ? (
        renderJoinView()
      ) : user.role === 'team_owner' ? (
        renderOwnerView()
      ) : user.team_id ? (
        renderMemberView()
      ) : (
        renderJoinView()
      )}

      <Modal
        open={resetCodeModalOpen}
        onClose={() => setResetCodeModalOpen(false)}
        title="重置邀请码"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetCodeModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" loading={isResettingCode} onClick={handleResetInviteCode}>
              确认重置
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          重置后旧邀请码将失效，确定要生成新邀请码吗？
        </p>
      </Modal>

      <Modal
        open={removeModal.open}
        onClose={() => setRemoveModal({ open: false, memberId: null, memberName: '' })}
        title="移除成员"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRemoveModal({ open: false, memberId: null, memberName: '' })}
            >
              取消
            </Button>
            <Button variant="danger" loading={isRemovingMember} onClick={handleRemoveMember}>
              确认移除
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          确定将 {removeModal.memberName} 从团队中移除？该成员将失去团队资源访问权限。
        </p>
      </Modal>
    </div>
  );
}
