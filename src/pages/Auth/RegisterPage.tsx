import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import {
  AuthLayout,
  AuthRouteGuard,
  PasswordStrength,
  RegisterTypeSelector,
} from '@/components/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import {
  getApiErrorMessage,
  getApiErrorStatus,
  validateEmail,
  validatePassword,
  validateUsername,
} from '@/lib/validation';
import type { RegisterType } from '@/types';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const { success, error: toastError } = useToast();

  const [registerType, setRegisterType] = useState<RegisterType>('personal');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateAll = () => {
    const next: Record<string, string | undefined> = {
      email: validateEmail(email),
      username: validateUsername(username),
      password: validatePassword(password),
      confirmPassword: !confirmPassword
        ? '请再次输入密码'
        : confirmPassword !== password
          ? '两次输入的密码不一致'
          : undefined,
    };
    if (registerType === 'team') {
      if (!teamName.trim()) next.teamName = '请输入团队名称';
      else if (teamName.length < 2 || teamName.length > 50) {
        next.teamName = '团队名称长度为 2-50 个字符';
      }
    }
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);
    try {
      await register({
        email: email.trim(),
        username: username.trim(),
        password,
        register_type: registerType,
        ...(registerType === 'team' ? { team_name: teamName.trim() } : {}),
      });
      success('注册成功，请登录');
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err) {
      const status = getApiErrorStatus(err);
      if (status === 409) {
        setErrors({ email: '该邮箱已注册，请直接登录' });
      } else if (!status) {
        toastError('网络连接失败，请检查网络');
      } else {
        toastError(getApiErrorMessage(err, '注册失败，请重试'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthRouteGuard>
      <AuthLayout cardWidth={440}>
        <form className="auth-form" onSubmit={handleSubmit}>
          <RegisterTypeSelector value={registerType} onChange={setRegisterType} />

          <Input
            label="邮箱地址"
            size="lg"
            fullWidth
            placeholder="请输入邮箱地址"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
            }}
            onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
            error={errors.email}
          />
          {errors.email?.includes('已注册') && (
            <Link to="/login" className="auth-form__inline-link">
              去登录 →
            </Link>
          )}

          <Input
            label="用户名"
            size="lg"
            fullWidth
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) {
                setErrors((prev) => ({ ...prev, username: validateUsername(e.target.value) }));
              }
            }}
            onBlur={() => setErrors((prev) => ({ ...prev, username: validateUsername(username) }))}
            error={errors.username}
          />

          <div>
            <Input
              label="密码"
              size="lg"
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="至少 8 位，含大小写字母和数字"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
                }
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, password: validatePassword(password) }))}
              error={errors.password}
              rightIcon={
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <PasswordStrength password={password} />
          </div>

          <Input
            label="确认密码"
            size="lg"
            fullWidth
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({
                  ...prev,
                  confirmPassword:
                    e.target.value !== password ? '两次输入的密码不一致' : undefined,
                }));
              }
            }}
            error={errors.confirmPassword}
            rightIcon={
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {registerType === 'team' && (
            <Input
              label="团队名称"
              size="lg"
              fullWidth
              placeholder="请输入团队名称"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              error={errors.teamName}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
            className="auth-form__submit"
          >
            创建账户
          </Button>

          <p className="auth-form__footer">
            已有账号？{' '}
            <Link to="/login" className="auth-form__link">
              立即登录
            </Link>
          </p>
        </form>
      </AuthLayout>
    </AuthRouteGuard>
  );
}
