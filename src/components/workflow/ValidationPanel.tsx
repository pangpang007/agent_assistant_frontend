import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';

export function ValidationPanel() {
  const issues = useWorkflowEditorStore((s) => s.validationIssues);

  if (issues.length === 0) {
    return <div className="validation-panel validation-panel--ok">✅ 校验通过</div>;
  }

  return (
    <div className="validation-panel">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className={
            issue.level === 'error'
              ? 'validation-panel__item validation-panel__item--error'
              : 'validation-panel__item validation-panel__item--warning'
          }
        >
          {issue.message}
        </div>
      ))}
    </div>
  );
}
