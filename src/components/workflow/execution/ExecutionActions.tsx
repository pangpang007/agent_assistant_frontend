import { RotateCcw, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { isExecutionActive } from '@/stores/executionStore';
import type { ExecutionStatus } from '@/types/execution';

interface ExecutionActionsProps {
  status: ExecutionStatus;
  onStop: () => void;
  onClose: () => void;
  onRetry: () => void;
  stopLoading?: boolean;
}

export function ExecutionActions({ status, onStop, onClose, onRetry, stopLoading }: ExecutionActionsProps) {
  const active = isExecutionActive(status);
  const terminal = status === 'completed' || status === 'failed' || status === 'stopped';

  return (
    <div className="execution-actions">
      {active ? (
        <Button variant="danger" size="sm" leftIcon={<Square size={14} />} loading={stopLoading} onClick={onStop}>
          停止执行
        </Button>
      ) : null}
      {terminal ? (
        <>
          <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={onRetry}>
            重新运行
          </Button>
          <Button variant="ghost" size="sm" leftIcon={<X size={14} />} onClick={onClose}>
            关闭面板
          </Button>
        </>
      ) : null}
    </div>
  );
}
