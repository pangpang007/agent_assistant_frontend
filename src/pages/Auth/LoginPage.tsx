import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout, AuthRouteGuard } from '@/components/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage, getApiErrorStatus, validateEmail } from '@/lib/validation';
import './AuthPages.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const { success, error: toastError } = useToast();

  const registered = (location.state as { registered?: boolean } | null)?.registered;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailValid = !validateEmail(email);

  const handleEmailBlur = () => {
    const err = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: err }));
  };

  const handlePasswordBlur = () => {
    if (!password) setErrors((prev) => ({ ...prev, password: '请输入密码' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = !password ? '请输入密码' : undefined;
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      success('登录成功');
      navigate('/', { replace: true });
    } catch (err) {
      const status = getApiErrorStatus(err);
      if (status === 401) {
        setErrors({ password: '邮箱或密码错误' });
      } else if (!status) {
        toastError('网络连接失败，请检查网络');
      } else {
        toastError(getApiErrorMessage(err, '登录失败，请重试'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthRouteGuard>
      <AuthLayout>
        {registered && (
          <div className="auth-success-banner">注册成功，请使用你的邮箱和密码登录</div>
        )}
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="邮箱地址"
            size="lg"
            fullWidth
            type="email"
            placeholder="请输入邮箱地址"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
            }}
            onBlur={handleEmailBlur}
            error={errors.email}
          />
          <Input
            label="密码"
            size="lg"
            fullWidth
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入密码"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password && e.target.value) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            onBlur={handlePasswordBlur}
            error={errors.password}
            rightIcon={
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={!isEmailValid || !password || isSubmitting}
            className="auth-form__submit"
          >
            登录
          </Button>
          <p className="auth-form__footer">
            还没有账号？{' '}
            <Link to="/register" className="auth-form__link">
              立即注册
            </Link>
          </p>
        </form>
      </AuthLayout>
    </AuthRouteGuard>
  );
}
