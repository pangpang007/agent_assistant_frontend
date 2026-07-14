import clsx from 'clsx';
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  PauseCircle,
  SkipForward,
  XCircle,
} from 'lucide-react';
import type { NodeExecutionState, NodeExecutionStatus } from '@/types/execution';
import { formatDuration } from '@/hooks/useExecutionTimer';
import { NodeDetailExpand } from './NodeDetailExpand';
import { ReviewActionPanel } from './ReviewActionPanel';
import type { WSReviewActionMessage } from '@/types/execution';

function StatusIcon({ status }: { status: NodeExecutionStatus }) {
  switch (status) {
    case 'running':
      return <Loader2 size={14} className="exec-animate-waiting" style={{ color: 'var(--accent-primary)' }} />;
    case 'success':
      return <CheckCircle size={14} style={{ color: 'var(--accent-success)' }} />;
    case 'error':
      return <XCircle size={14} style={{ color: 'var(--accent-danger)' }} />;
    case 'waiting_review':
      return <PauseCircle size={14} style={{ color: 'var(--accent-warning)' }} />;
    case 'skipped':
      return <SkipForward size={14} style={{ color: 'var(--text-tertiary)' }} />;
    case 'pending':
    case 'idle':
    default:
      return <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />;
  }
}

function statusMetaText(node: NodeExecutionState): string {
  if (node.status === 'running') return '执行中...';
  if (node.status === 'waiting_review') return '等待审核';
  if (node.status === 'error') return '错误';
  if (node.status === 'skipped') return '已跳过';
  if (node.duration != null) return formatDuration(node.duration);
  return '';
}

function isClickable(status: NodeExecutionStatus): boolean {
  return status === 'success' || status === 'error' || status === 'waiting_review';
}

interface NodeStatusItemProps {
  node: NodeExecutionState;
  isExpanded: boolean;
  onToggle: () => void;
  executionId: string | null;
  reviewInputData: Record<string, unknown> | null;
  reviewDescription: string | null;
  sendReview: (message: WSReviewActionMessage) => void;
}

export function NodeStatusItem({
  node,
  isExpanded,
  onToggle,
  executionId,
  reviewInputData,
  reviewDescription,
  sendReview,
}: NodeStatusItemProps) {
  const clickable = isClickable(node.status);
  const showReview =
    isExpanded && node.status === 'waiting_review' && executionId != null;

  return (
    <div
      className={clsx(
        'node-status-item',
        `node-status-item--${node.status}`,
        clickable && 'node-status-item--clickable',
        isExpanded && 'node-status-item--expanded',
        node.status === 'running' && 'node-status-item--running',
        node.status === 'waiting_review' && 'node-status-item--waiting_review',
        node.status === 'error' && 'node-status-item--error',
      )}
    >
      <div
        className="node-status-item__row"
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? onToggle : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle();
                }
              }
            : undefined
        }
      >
        <span className="node-status-item__icon">
          <StatusIcon status={node.status} />
        </span>
        <span className="node-status-item__name">{node.nodeName}</span>
        <span className="node-status-item__meta">
          {statusMetaText(node)}
          {clickable ? (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
        </span>
      </div>

      {isExpanded && !showReview ? (
        <div className="node-status-item__detail">
          <NodeDetailExpand node={node} />
        </div>
      ) : null}

      {showReview ? (
        <div className="node-status-item__detail">
          <ReviewActionPanel
            executionId={executionId}
            nodeId={node.nodeId}
            inputData={reviewInputData ?? node.input}
            description={reviewDescription}
            reviewRecords={node.reviewRecords}
            sendReview={sendReview}
          />
        </div>
      ) : null}
    </div>
  );
}
