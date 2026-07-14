import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface StopConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function StopConfirmModal({ open, onClose, onConfirm, loading }: StopConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="停止执行"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button variant="danger" loading={loading} onClick={() => void onConfirm()}>
            确认停止
          </Button>
        </>
      }
    >
      <p>确定要停止当前工作流执行吗？已完成的节点结果将保留，未完成的节点将被中断。</p>
    </Modal>
  );
}
