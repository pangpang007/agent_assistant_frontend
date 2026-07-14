import { isExecutionActive, useExecutionStore } from '@/stores/executionStore';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import { ExecutionPanel, closeExecutionPanel } from './execution/ExecutionPanel';
import { PropertiesPanel } from './PropertiesPanel';

interface RightPanelContainerProps {
  onRetry: () => void;
  onStop: () => Promise<void>;
  sendReview: Parameters<typeof ExecutionPanel>[0]['sendReview'];
  wsSend: Parameters<typeof ExecutionPanel>[0]['wsSend'];
}

export function RightPanelContainer({ onRetry, onStop, sendReview, wsSend }: RightPanelContainerProps) {
  const rightPanel = useWorkflowEditorStore((s) => s.rightPanel);
  const executionStatus = useExecutionStore((s) => s.status);
  const isExecuting = isExecutionActive(executionStatus);

  const handleClose = () => {
    closeExecutionPanel();
  };

  if (isExecuting || rightPanel === 'execution') {
    return (
      <ExecutionPanel
        onClose={handleClose}
        onRetry={onRetry}
        onStop={onStop}
        sendReview={sendReview}
        wsSend={wsSend}
      />
    );
  }

  return <PropertiesPanel />;
}
