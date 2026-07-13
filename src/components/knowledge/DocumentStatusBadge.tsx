import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { DocumentStatus } from '@/types';
import './DocumentStatusBadge.css';

export interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

const CONFIG: Record<
  DocumentStatus,
  { icon: typeof Loader2; label: string; className: string }
> = {
  processing: { icon: Loader2, label: '处理中', className: 'doc-status--processing' },
  ready: { icon: CheckCircle2, label: '已就绪', className: 'doc-status--ready' },
  failed: { icon: XCircle, label: '失败', className: 'doc-status--failed' },
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const { icon: Icon, label, className } = CONFIG[status];
  return (
    <span className={`doc-status ${className}`}>
      <Icon size={12} className={status === 'processing' ? 'doc-status__spin' : undefined} />
      {label}
    </span>
  );
}
