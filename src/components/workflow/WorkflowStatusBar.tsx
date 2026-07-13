import { useMemo, useState } from 'react';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import { ValidationPanel } from './ValidationPanel';

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '从未保存';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

export function WorkflowStatusBar() {
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const lastSavedAt = useWorkflowEditorStore((s) => s.lastSavedAt);
  const currentVersionNumber = useWorkflowEditorStore((s) => s.currentVersionNumber);
  const validationIssues = useWorkflowEditorStore((s) => s.validationIssues);
  const [showValidation, setShowValidation] = useState(false);

  const errorCount = useMemo(
    () => validationIssues.filter((i) => i.level === 'error').length,
    [validationIssues],
  );
  const warningCount = useMemo(
    () => validationIssues.filter((i) => i.level === 'warning').length,
    [validationIssues],
  );

  return (
    <>
      <footer className="workflow-status-bar">
        <span>节点: {nodes.length}</span>
        <span>连线: {edges.length}</span>
        <span>最后保存: {formatRelativeTime(lastSavedAt)}</span>
        <button
          type="button"
          className="workflow-status-bar__validation"
          onClick={() => setShowValidation((v) => !v)}
        >
          {errorCount + warningCount === 0
            ? '✅ 校验通过'
            : `⚠️ ${errorCount + warningCount} 个问题`}
        </button>
        <span>v{currentVersionNumber}</span>
      </footer>
      {showValidation ? (
        <div className="workflow-status-bar__panel">
          <ValidationPanel />
        </div>
      ) : null}
    </>
  );
}
