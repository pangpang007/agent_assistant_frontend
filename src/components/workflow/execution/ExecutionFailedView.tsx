import { XCircle } from 'lucide-react';
import { useExecutionStore } from '@/stores/executionStore';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import { formatDuration } from '@/hooks/useExecutionTimer';

export function ExecutionFailedView() {
  const errorMessage = useExecutionStore((s) => s.errorMessage);
  const failedNodeId = useExecutionStore((s) => s.failedNodeId);
  const totalDuration = useExecutionStore((s) => s.totalDuration);
  const status = useExecutionStore((s) => s.status);
  const nodes = useWorkflowEditorStore((s) => s.nodes);

  const failedNode = nodes.find((n) => n.id === failedNodeId);
  const title = status === 'stopped' ? '执行已停止' : '执行失败';

  return (
    <div className="execution-result-view">
      <XCircle className="execution-result-view__icon execution-result-view__icon--failed" />
      <div className="execution-result-view__title">{title}</div>
      <div className="execution-result-view__desc">
        {failedNode ? `失败节点：${failedNode.data.label}` : null}
        {totalDuration > 0 ? ` · 耗时 ${formatDuration(totalDuration)}` : null}
      </div>
      {errorMessage && status !== 'stopped' ? (
        <div className="execution-result-view__output">
          <div className="execution-panel__section-title">错误详情</div>
          <pre>{errorMessage}</pre>
        </div>
      ) : null}
    </div>
  );
}
