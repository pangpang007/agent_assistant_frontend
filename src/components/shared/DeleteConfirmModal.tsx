import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import './DeleteConfirmModal.css';

export interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  warningText?: string;
  referenceList?: string[];
  confirmText?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  warningText,
  referenceList,
  confirmText = '确认删除',
  isDeleting = false,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            取消
          </Button>
          <Button variant="danger" loading={isDeleting} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      {warningText && (
        <div className="delete-confirm__warning">
          <AlertTriangle size={16} className="delete-confirm__warning-icon" />
          <p className="delete-confirm__warning-text">{warningText}</p>
        </div>
      )}
      <p className="delete-confirm__description">{description}</p>
      {referenceList && referenceList.length > 0 && (
        <ul className="delete-confirm__refs">
          {referenceList.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
