import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import './ErrorPage.css';

export interface ErrorPageProps {
  error?: Error | null;
  onReset?: () => void;
}

export default function ErrorPage({ error, onReset }: ErrorPageProps) {
  return (
    <div className="error-page">
      <div className="error-page__content">
        <AlertTriangle size={48} strokeWidth={1.5} className="error-page__icon" />
        <div className="error-page__code">500</div>
        <h1 className="error-page__title">出了点问题</h1>
        <p className="error-page__desc">应用遇到了意外错误，请尝试刷新页面。</p>
        {error && (
          <details className="error-page__details">
            <summary>错误详情</summary>
            <pre>{error.message}</pre>
          </details>
        )}
        <div className="error-page__actions">
          <Button variant="primary" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
          {onReset && (
            <Button variant="secondary" onClick={onReset}>
              重试
            </Button>
          )}
          <Button variant="ghost" onClick={() => window.location.assign('/dashboard')}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}
