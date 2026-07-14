import { useCallback, useState } from 'react';
import { isExecutionActive, useExecutionStore } from '@/stores/executionStore';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { WSClientMessage, WSReviewActionMessage } from '@/types/execution';
import { ExecutionActions } from './ExecutionActions';
import { ExecutionCompleteView } from './ExecutionCompleteView';
import { ExecutionFailedView } from './ExecutionFailedView';
import { ExecutionLogStream } from './ExecutionLogStream';
import { ExecutionPanelHeader } from './ExecutionPanelHeader';
import { ExecutionProgress } from './ExecutionProgress';
import { ExecutionStats } from './ExecutionStats';
import { NodeStatusList } from './NodeStatusList';
import { StopConfirmModal } from './StopConfirmModal';
import './execution.css';

interface ExecutionPanelProps {
  onClose: () => void;
  onRetry: () => void;
  onStop: () => Promise<void>;
  sendReview: (message: WSReviewActionMessage) => void;
  wsSend: (message: WSClientMessage) => void;
}

export function ExecutionPanel({ onClose, onRetry, onStop, sendReview }: ExecutionPanelProps) {
  const status = useExecutionStore((s) => s.status);
  const executionId = useExecutionStore((s) => s.executionId);
  const wsConnectionStatus = useExecutionStore((s) => s.wsConnectionStatus);

  const [stopOpen, setStopOpen] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);

  const handleCloseRequest = useCallback(() => {
    if (isExecutionActive(status)) {
      setStopOpen(true);
      return;
    }
    onClose();
  }, [onClose, status]);

  const handleConfirmStop = async () => {
    setStopLoading(true);
    try {
      await onStop();
      setStopOpen(false);
    } finally {
      setStopLoading(false);
    }
  };

  const terminal = status === 'completed' || status === 'failed' || status === 'stopped';

  return (
    <aside className="execution-panel">
      <ExecutionPanelHeader
        executionId={executionId}
        executionStatus={status}
        wsStatus={wsConnectionStatus}
        onClose={handleCloseRequest}
      />

      <div className="execution-panel__scroll">
        {status === 'completed' ? <ExecutionCompleteView /> : null}
        {status === 'failed' || status === 'stopped' ? <ExecutionFailedView /> : null}

        {!terminal ? (
          <>
            <ExecutionProgress status={status} />
            <NodeStatusList sendReview={sendReview} />
            <ExecutionStats />
            <ExecutionLogStream />
          </>
        ) : (
          <>
            <ExecutionProgress status={status} />
            <ExecutionStats />
          </>
        )}
      </div>

      <div className="execution-panel__footer">
        <ExecutionActions
          status={status}
          onStop={() => setStopOpen(true)}
          onClose={onClose}
          onRetry={onRetry}
          stopLoading={stopLoading}
        />
      </div>

      <StopConfirmModal
        open={stopOpen}
        onClose={() => setStopOpen(false)}
        onConfirm={handleConfirmStop}
        loading={stopLoading}
      />
    </aside>
  );
}

/** Clear execution state and restore properties panel. */
export function closeExecutionPanel() {
  useExecutionStore.getState().reset();
  useWorkflowEditorStore.getState().setRightPanel('properties');
  useWorkflowEditorStore.getState().setExecutionStatus('idle');
  useWorkflowEditorStore.getState().setExecutionId(null);
  useWorkflowEditorStore.getState().nodes.forEach((n) => {
    useWorkflowEditorStore.getState().updateNodeData(n.id, {
      executionStatus: undefined,
      executionResult: undefined,
      executionMeta: undefined,
    });
  });
}
