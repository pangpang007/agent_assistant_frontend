import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="quick-actions">
      <Button
        variant="primary"
        size="md"
        leftIcon={<Plus size={16} strokeWidth={1.5} />}
        onClick={() => navigate('/workflows/new')}
      >
        新建工作流
      </Button>
      <Button
        variant="secondary"
        size="md"
        leftIcon={<LayoutTemplate size={16} strokeWidth={1.5} />}
        onClick={() => navigate('/templates')}
      >
        从模板创建
      </Button>
    </div>
  );
}
