import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import '../pages.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="page-container page-container--list">
      <EmptyState
        icon={<Search size={64} strokeWidth={1.5} />}
        title="页面未找到"
        description="你访问的页面不存在或已被移除"
        action={{ label: '返回首页', onClick: () => navigate('/') }}
      />
    </div>
  );
}
