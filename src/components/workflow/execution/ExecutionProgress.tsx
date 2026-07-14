import clsx from 'clsx';
import { useExecutionStore } from '@/stores/executionStore';
import type { ExecutionStatus } from '@/types/execution';

function countCompleted(nodeStates: Map<string, { status: string }>): number {
  let count = 0;
  nodeStates.forEach((node) => {
    if (node.status === 'success' || node.status === 'skipped') count += 1;
  });
  return count;
}

interface ExecutionProgressProps {
  status: ExecutionStatus;
}

export function ExecutionProgress({ status }: ExecutionProgressProps) {
  const nodeStates = useExecutionStore((s) => s.nodeStates);
  const totalNodeCount = useExecutionStore((s) => s.totalNodeCount);
  const completedNodeCount = useExecutionStore((s) => s.completedNodeCount);

  const completed = completedNodeCount || countCompleted(nodeStates);
  const total = totalNodeCount || nodeStates.size;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const barClass =
    status === 'failed' || status === 'stopped'
      ? 'execution-progress__bar-fill--failed'
      : status === 'completed'
        ? 'execution-progress__bar-fill--completed'
        : 'execution-progress__bar-fill--running';

  return (
    <section className="execution-panel__section">
      <div className="execution-progress__meta">
        <span className="execution-panel__section-title" style={{ marginBottom: 0 }}>
          执行进度
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {percent}%
        </span>
      </div>
      <div className="execution-progress__bar-track">
        <div
          className={clsx('execution-progress__bar-fill', barClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="execution-progress__steps">
        第 {completed} 步 / 共 {total} 步
      </div>
    </section>
  );
}
