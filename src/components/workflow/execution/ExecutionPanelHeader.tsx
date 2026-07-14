import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import type { ExecutionStatus } from '@/types/execution';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import type { WSConnectionStatus } from '@/types/execution';

const STATUS_TAG: Partial<Record<ExecutionStatus, { label: string; color: 'primary' | 'success' | 'warning' | 'danger' | 'default' }>> = {
  running: { label: '执行中', color: 'primary' },
  waiting_review: { label: '等待审核', color: 'warning' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'danger' },
  stopped: { label: '已停止', color: 'default' },
  connecting: { label: '连接中', color: 'primary' },
};

interface ExecutionPanelHeaderProps {
  executionId: string | null;
  executionStatus: ExecutionStatus;
  wsStatus: WSConnectionStatus;
  onClose: () => void;
}

export function ExecutionPanelHeader({
  executionId,
  executionStatus,
  wsStatus,
  onClose,
}: ExecutionPanelHeaderProps) {
  const tag = STATUS_TAG[executionStatus];
  const shortId = executionId ? executionId.slice(0, 8) : '—';

  return (
    <header className="execution-panel-header">
      <div className="execution-panel-header__left">
        <ConnectionStatusIndicator status={wsStatus} />
        {tag ? <Tag color={tag.color}>{tag.label}</Tag> : null}
        <span className="execution-panel-header__id">#{shortId}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={onClose} aria-label="关闭执行面板">
        <X size={16} />
      </Button>
    </header>
  );
}
