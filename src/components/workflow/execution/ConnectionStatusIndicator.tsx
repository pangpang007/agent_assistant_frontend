import clsx from 'clsx';
import type { WSConnectionStatus } from '@/types/execution';

const STATUS_LABELS: Record<WSConnectionStatus, string> = {
  connected: '已连接',
  connecting: '连接中',
  reconnecting: '重连中',
  disconnected: '已断开',
};

interface ConnectionStatusIndicatorProps {
  status: WSConnectionStatus;
  className?: string;
}

export function ConnectionStatusIndicator({ status, className }: ConnectionStatusIndicatorProps) {
  return (
    <span className={clsx('connection-status', className)}>
      <span
        className={clsx('connection-status__dot', `connection-status__dot--${status}`)}
        aria-hidden
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
