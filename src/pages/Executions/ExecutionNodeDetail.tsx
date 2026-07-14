import { format, parseISO } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Tag } from '@/components/ui/Tag';
import type { HistoryNodeResult } from '@/types/phase6';
export interface ExecutionNodeDetailProps {
  open: boolean;
  onClose: () => void;
  node: HistoryNodeResult | null;
}

function jsonBlock(data: Record<string, unknown> | null | undefined) {
  if (!data || Object.keys(data).length === 0) return '—';
  return JSON.stringify(data, null, 2);
}

export function ExecutionNodeDetail({ open, onClose, node }: ExecutionNodeDetailProps) {
  if (!node) return null;

  const statusColor: Record<string, 'success' | 'danger' | 'warning' | 'primary' | 'default'> = {
    success: 'success',
    failed: 'danger',
    skipped: 'default',
    running: 'primary',
    waiting: 'warning',
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={node.node_name}
      description={`${node.node_type} · ${node.node_id}`}
      size="lg"
    >
      <div className="phase6-form-stack">
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Tag color={statusColor[node.status] ?? 'default'}>
            {node.status}
          </Tag>
          {node.duration_ms != null ? (
            <Tag color="default">{node.duration_ms} ms</Tag>
          ) : null}
          {node.tokens_used != null ? <Tag color="default">{node.tokens_used} tokens</Tag> : null}
        </div>

        <div>
          <span className="phase6-form-label">开始时间</span>
          <p className="phase6-mono" style={{ margin: 0 }}>
            {format(parseISO(node.started_at), 'yyyy-MM-dd HH:mm:ss')}
          </p>
        </div>
        {node.finished_at ? (
          <div>
            <span className="phase6-form-label">结束时间</span>
            <p className="phase6-mono" style={{ margin: 0 }}>
              {format(parseISO(node.finished_at), 'yyyy-MM-dd HH:mm:ss')}
            </p>
          </div>
        ) : null}

        {node.error_message ? (
          <div>
            <span className="phase6-form-label">错误信息</span>
            <pre className="phase6-json-block" style={{ color: 'var(--accent-danger)' }}>
              {node.error_message}
            </pre>
          </div>
        ) : null}

        <div>
          <span className="phase6-form-label">输入</span>
          <pre className="phase6-json-block">{jsonBlock(node.input_data)}</pre>
        </div>
        <div>
          <span className="phase6-form-label">输出</span>
          <pre className="phase6-json-block">{jsonBlock(node.output_data)}</pre>
        </div>
      </div>
    </Modal>
  );
}
