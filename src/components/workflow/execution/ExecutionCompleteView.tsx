import { CheckCircle2 } from 'lucide-react';
import { useExecutionStore } from '@/stores/executionStore';
import { formatDuration } from '@/hooks/useExecutionTimer';

export function ExecutionCompleteView() {
  const finalOutput = useExecutionStore((s) => s.finalOutput);
  const totalDuration = useExecutionStore((s) => s.totalDuration);
  const completedNodeCount = useExecutionStore((s) => s.completedNodeCount);
  const totalNodeCount = useExecutionStore((s) => s.totalNodeCount);

  const outputText =
    finalOutput != null ? JSON.stringify(finalOutput, null, 2) : '无输出数据';

  return (
    <div className="execution-result-view">
      <CheckCircle2 className="execution-result-view__icon execution-result-view__icon--success" />
      <div className="execution-result-view__title">执行完成</div>
      <div className="execution-result-view__desc">
        耗时 {formatDuration(totalDuration)}，完成 {completedNodeCount}/{totalNodeCount} 个节点
      </div>
      <div className="execution-result-view__output">
        <div className="execution-panel__section-title">最终输出</div>
        <pre>{outputText}</pre>
      </div>
    </div>
  );
}
