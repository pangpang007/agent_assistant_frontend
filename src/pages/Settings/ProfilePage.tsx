import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/userService';
import {
  formatDateTime,
  getApiErrorMessage,
  getApiErrorStatus,
  validatePassword,
  validateUsername,
} from '@/lib/validation';
import '@/pages/Auth/AuthPages.css';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const resetAuth = useAuthStore((s) => s.reset);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [usernameDraft, setUsernameDraft] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string>();
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const username = usernameDraft ?? user.username;

  const initial = user.username.charAt(0).toUpperCase();
  const usernameChanged = username.trim() !== user.username;

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateUsername(username);
    if (err) {
      setProfileError(err);
      return;
    }
    setIsProfileSubmitting(true);
    try {
      const updated = await userService.updateProfile({ username: username.trim() });
      updateUser(updated);
      setUsernameDraft(null);
      success('资料已更新');
    } catch (err) {
      toastError(getApiErrorMessage(err, '保存失败，请重试'));
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = '请输入当前密码';
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) next.newPassword = pwdErr;
    if (!confirmNewPassword) next.confirmNewPassword = '请再次输入新密码';
    else if (confirmNewPassword !== newPassword) next.confirmNewPassword = '两次输入的密码不一致';
    setPasswordErrors(next);
    if (Object.keys(next).length) return;

    setIsPasswordSubmitting(true);
    try {
      await userService.updatePassword({
        old_password: currentPassword,
        new_password: newPassword,
      });
      success('密码更新成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordErrors({});
    } catch (err) {
      if (getApiErrorStatus(err) === 400 || getApiErrorStatus(err) === 401) {
        setPasswordErrors({ currentPassword: '当前密码错误' });
      } else {
        toastError(getApiErrorMessage(err, '密码更新失败'));
      }
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userService.deleteAccount();
      resetAuth();
      success('账户已删除');
      navigate('/login', { replace: true });
    } catch (err) {
      toastError(getApiErrorMessage(err, '删除失败，请重试'));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h1 className="settings-page__title">个人资料</h1>
        <p className="settings-page__desc">管理你的账户信息</p>
      </header>

      <Card padding="md">
        <div className="settings-page__avatar-row">
          <div className="settings-page__avatar">
            {user.avatar_url ? <img src={user.avatar_url} alt={user.username} /> : initial}
          </div>
          <div>
            <div className="settings-page__avatar-name">{user.username}</div>
            <Button variant="secondary" size="sm" disabled>
              修改头像
            </Button>
            <p className="settings-page__avatar-hint">Phase 1 暂不支持上传，后续版本开放</p>
          </div>
        </div>
      </Card>

      <Card title="基本信息" padding="md" className="settings-page__section">
        <form onSubmit={handleProfileSubmit}>
          <Input label="邮箱" size="md" fullWidth value={user.email} disabled />
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Input
              label="用户名"
              size="md"
              fullWidth
              value={username}
              onChange={(e) => {
                setUsernameDraft(e.target.value);
                if (profileError) setProfileError(validateUsername(e.target.value));
              }}
              error={profileError}
            />
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Input
              label="注册时间"
              size="md"
              fullWidth
              value={formatDateTime(user.created_at)}
              disabled
            />
          </div>
          <div className="settings-page__actions">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isProfileSubmitting}
              disabled={!usernameChanged || isProfileSubmitting || !!validateUsername(username)}
            >
              保存修改
            </Button>
          </div>
        </form>
      </Card>

      <Card title="修改密码" padding="md" className="settings-page__section">
        <form onSubmit={handlePasswordSubmit}>
          <Input
            label="当前密码"
            type="password"
            size="md"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={passwordErrors.currentPassword}
          />
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Input
              label="新密码"
              type="password"
              size="md"
              fullWidth
              placeholder="至少 8 位，含大小写字母和数字"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={passwordErrors.newPassword}
            />
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Input
              label="确认新密码"
              type="password"
              size="md"
              fullWidth
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              error={passwordErrors.confirmNewPassword}
            />
          </div>
          <div className="settings-page__actions">
            <Button type="submit" variant="primary" size="md" loading={isPasswordSubmitting}>
              更新密码
            </Button>
          </div>
        </form>
      </Card>

      <div className="settings-page__danger">
        <h3 className="settings-page__danger-title">删除账户</h3>
        <p className="settings-page__danger-desc">
          删除后无法恢复，所有数据将永久丢失。如果你是团队 owner，团队也将被删除。
        </p>
        <Button variant="danger" size="md" onClick={() => setIsDeleteModalOpen(true)}>
          删除我的账户
        </Button>
      </div>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="确认删除账户"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDeleteAccount}>
              确认删除
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          此操作不可撤销，确定要删除你的账户吗？
        </p>
      </Modal>
    </div>
  );
}
