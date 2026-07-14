import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import './ErrorPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div className="error-page__content">
        <FileQuestion size={64} strokeWidth={1.5} className="error-page__icon" />
        <div className="error-page__code">404</div>
        <h1 className="error-page__title">页面不存在</h1>
        <p className="error-page__desc">你访问的页面不存在或已被移除。</p>
        <div className="error-page__actions">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
        </div>
      </div>
    </div>
  );
}
