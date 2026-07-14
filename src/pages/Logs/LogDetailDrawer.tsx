import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import { X } from 'lucide-react';
import { Tag } from '@/components/ui/Tag';
import type { CenterLogEntry } from '@/types/phase6';
import './LogDetailDrawer.css';
import '@/styles/phase6.css';

export interface LogDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  log: CenterLogEntry | null;
}

function levelColor(level: CenterLogEntry['level']): 'primary' | 'warning' | 'danger' {
  if (level === 'ERROR') return 'danger';
  if (level === 'WARN') return 'warning';
  return 'primary';
}

export function LogDetailDrawer({ open, onClose, log }: LogDetailDrawerProps) {
  if (!open || !log) return null;

  return createPortal(
    <>
      <div className="log-detail-drawer__backdrop" onClick={onClose} aria-hidden />
      <aside className="log-detail-drawer" role="dialog" aria-modal="true">
        <div className="log-detail-drawer__header">
          <div>
            <h2 className="log-detail-drawer__title">日志详情</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
              {format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
            </p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </div>
        <div className="log-detail-drawer__body">
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Tag color={levelColor(log.level)}>{log.level}</Tag>
            <Tag color="default">{log.workflow_name}</Tag>
          </div>
          <div>
            <span className="phase6-form-label">消息</span>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              {log.message}
            </p>
          </div>
          <div>
            <span className="phase6-form-label">执行 ID</span>
            <p className="phase6-mono" style={{ margin: 0 }}>
              {log.execution_id}
            </p>
          </div>
          {log.node_name ? (
            <div>
              <span className="phase6-form-label">节点</span>
              <p style={{ margin: 0 }}>{log.node_name}</p>
            </div>
          ) : null}
          {log.metadata && Object.keys(log.metadata).length > 0 ? (
            <div>
              <span className="phase6-form-label">元数据</span>
              <pre className="phase6-json-block">{JSON.stringify(log.metadata, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      </aside>
    </>,
    document.body,
  );
}
