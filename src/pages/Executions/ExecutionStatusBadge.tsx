import { Tag } from '@/components/ui/Tag';
import type { HistoryExecutionStatus } from '@/types/phase6';

const STATUS_CONFIG: Record<
  HistoryExecutionStatus,
  { label: string; color: 'success' | 'danger' | 'warning' | 'primary' | 'default' }
> = {
  success: { label: '成功', color: 'success' },
  failed: { label: '失败', color: 'danger' },
  cancelled: { label: '已取消', color: 'default' },
  running: { label: '运行中', color: 'primary' },
};

export interface ExecutionStatusBadgeProps {
  status: HistoryExecutionStatus;
}

export function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: 'default' as const };
  return <Tag color={config.color}>{config.label}</Tag>;
}
