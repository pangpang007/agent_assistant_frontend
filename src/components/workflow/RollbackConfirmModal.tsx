import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { VersionRecord } from '@/types/phase6';
import { format, parseISO } from 'date-fns';

export interface RollbackConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  version: VersionRecord | null;
  loading?: boolean;
}

export function RollbackConfirmModal({
  open,
  onClose,
  onConfirm,
  version,
  loading = false,
}: RollbackConfirmModalProps) {
  if (!version) return null;

  const timeLabel = version.created_at
    ? format(parseISO(version.created_at), 'yyyy-MM-dd HH:mm:ss')
    : '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="确认回滚"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            确认回滚
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        <AlertTriangle size={20} style={{ color: 'var(--accent-warning)', flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>
            你确定要将工作流回滚到 v{version.version_number} 吗？
          </p>
          <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            回滚后，当前的未保存修改将丢失，画布将恢复到 v{version.version_number}
            {timeLabel ? ` (${timeLabel})` : ''} 的状态。
          </p>
          <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            回滚不会删除历史版本，你仍可以切换到其他版本。
          </p>
        </div>
      </div>
    </Modal>
  );
}
