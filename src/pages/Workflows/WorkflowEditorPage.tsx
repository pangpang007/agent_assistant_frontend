import { useCallback, useEffect, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { ContextMenu } from '@/components/workflow/ContextMenu';
import { NodeLibrary } from '@/components/workflow/NodeLibrary';
import { RightPanelContainer } from '@/components/workflow/RightPanelContainer';
import { RunConfigModal } from '@/components/workflow/execution/RunConfigModal';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { WorkflowStatusBar } from '@/components/workflow/WorkflowStatusBar';
import { VersionSidebar } from '@/components/workflow/VersionSidebar';
import { WorkflowToolbar } from '@/components/workflow/WorkflowToolbar';
import { SaveAsTemplateModal } from '@/pages/Templates/SaveAsTemplateModal';
import { useExecutionMessageHandler } from '@/hooks/useExecutionMessageHandler';
import { useExecutionStore } from '@/stores/executionStore';
import { useExecutionTimer } from '@/hooks/useExecutionTimer';
import { useExecutionWebSocket } from '@/hooks/useExecutionWebSocket';
import { useWorkflowShortcuts } from '@/hooks/useWorkflowShortcuts';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/validation';
import { executionService } from '@/services/executionService';
import { workflowService } from '@/services/workflowService';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { WSClientMessage, WSReviewActionMessage } from '@/types/execution';
import type { Workflow } from '@/types';
import '@/styles/workflow.css';
import '@/styles/execution-animations.css';

function resolveWorkflowId(raw: Workflow | Record<string, unknown>): string | null {
  const candidates = [raw.id, (raw as { workflow_id?: string }).workflow_id];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError, warning: toastWarning } = useToast();

  const loadFromWorkflow = useWorkflowEditorStore((s) => s.loadFromWorkflow);
  const resetEditor = useWorkflowEditorStore((s) => s.reset);
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const workflowId = useWorkflowEditorStore((s) => s.workflowId);
  const workflowName = useWorkflowEditorStore((s) => s.workflowName);
  const currentVersionNumber = useWorkflowEditorStore((s) => s.currentVersionNumber);
  const isDirty = useWorkflowEditorStore((s) => s.isDirty);
  const markSaved = useWorkflowEditorStore((s) => s.markSaved);
  const runValidation = useWorkflowEditorStore((s) => s.runValidation);
  const setVersions = useWorkflowEditorStore((s) => s.setVersions);
  const setExecutionId = useWorkflowEditorStore((s) => s.setExecutionId);
  const setExecutionStatus = useWorkflowEditorStore((s) => s.setExecutionStatus);
  const setRightPanel = useWorkflowEditorStore((s) => s.setRightPanel);
  const initNodeStates = useExecutionStore((s) => s.initNodeStates);
  const resetExecution = useExecutionStore((s) => s.reset);
  const executionId = useExecutionStore((s) => s.executionId);
  const executionStatus = useExecutionStore((s) => s.status);
  const setExecutionStoreStatus = useExecutionStore((s) => s.setStatus);
  const setExecutionStoreId = useExecutionStore((s) => s.setExecutionId);
  const setWorkflowMeta = useExecutionStore((s) => s.setWorkflowMeta);
  const setInputValues = useExecutionStore((s) => s.setInputValues);
  const setWsConnectionStatus = useExecutionStore((s) => s.setWsConnectionStatus);
  const pushHistory = useWorkflowEditorStore((s) => s.pushHistory);

  const [isLoading, setIsLoading] = useState(true);
  const [retryOpen, setRetryOpen] = useState(false);
  const [versionSidebarOpen, setVersionSidebarOpen] = useState(false);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);

  const handleMessage = useExecutionMessageHandler();
  const timerActive =
    executionStatus === 'running' || executionStatus === 'waiting_review' || executionStatus === 'connecting';
  useExecutionTimer(timerActive);

  const { send: wsSend } = useExecutionWebSocket({
    executionId,
    onMessage: handleMessage,
    onStatusChange: setWsConnectionStatus,
    autoConnect: Boolean(executionId),
  });

  const handleSave = useCallback(async () => {
    if (!workflowId) return;
    const issues = runValidation();
    const errors = issues.filter((i) => i.level === 'error');
    if (errors.length > 0) {
      toastError(`校验失败：${errors[0].message}`);
      return;
    }
    if (nodes.length > 100) {
      toastWarning('节点数量较多，可能影响性能');
    }
    useWorkflowEditorStore.setState({ isSaving: true });
    try {
      const res = await workflowService.save(workflowId, { nodes, edges });
      markSaved(new Date().toISOString(), res.version.version);
      try {
        setVersions((await workflowService.getVersions(workflowId)) ?? []);
      } catch {
        // versions are optional after save
      }
      success('保存成功');
    } catch {
      toastError('保存失败，请重试');
      useWorkflowEditorStore.setState({ isSaving: false });
    }
  }, [edges, markSaved, nodes, runValidation, setVersions, success, toastError, toastWarning, workflowId]);

  useWorkflowShortcuts({ onSave: () => void handleSave() });

  const loadWorkflow = useCallback(
    async (workflowIdParam: string) => {
      setIsLoading(true);
      try {
        const workflow = await workflowService.getById(workflowIdParam);
        const resolvedId = resolveWorkflowId(workflow) ?? workflowIdParam;
        loadFromWorkflow(
          resolvedId,
          workflow.name || '未命名工作流',
          workflow.description || '',
          workflow.nodes ?? [],
          workflow.edges ?? [],
          workflow.current_version ?? 1,
        );
        try {
          const versions = await workflowService.getVersions(workflowIdParam);
          setVersions(Array.isArray(versions) ? versions : []);
        } catch {
          setVersions([]);
        }
        pushHistory();
      } catch (err) {
        if (getApiErrorStatus(err) === 404) {
          toastError('工作流不存在');
          navigate('/workflows');
        } else {
          toastError(getApiErrorMessage(err, '加载工作流失败'));
          navigate('/workflows');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [loadFromWorkflow, navigate, pushHistory, setVersions, toastError],
  );

  useEffect(() => {
    if (!id) {
      toastError('无效的工作流地址');
      navigate('/workflows', { replace: true });
      return;
    }

    let cancelled = false;

    if (id === 'new') {
      setIsLoading(true);
      workflowService
        .create({ name: '未命名工作流' })
        .then((workflow) => {
          if (cancelled) return;
          const createdId = resolveWorkflowId(workflow);
          if (!createdId) {
            throw new Error('创建成功但未返回工作流 ID');
          }
          navigate(`/workflows/${createdId}`, { replace: true });
        })
        .catch((err) => {
          if (cancelled) return;
          toastError(getApiErrorMessage(err, '创建工作流失败'));
          navigate('/workflows', { replace: true });
        });

      return () => {
        cancelled = true;
      };
    }

    resetEditor();
    resetExecution();
    void loadWorkflow(id);

    return () => {
      cancelled = true;
      resetEditor();
      resetExecution();
    };
  }, [id, loadWorkflow, navigate, resetEditor, resetExecution, toastError]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const blocker = useBlocker(isDirty);

  const startExecutionFlow = useCallback(
    async (inputs: Record<string, unknown>) => {
      if (!workflowId) return;

      initNodeStates(
        nodes.map((n) => ({
          id: n.id,
          name: n.data.label,
          type: n.data.nodeType,
        })),
      );
      setWorkflowMeta(workflowId, workflowName);
      setInputValues(inputs);
      setExecutionStoreStatus('connecting');

      const res = await executionService.startExecution({
        workflowId,
        inputValues: inputs,
      });

      setExecutionStoreId(res.executionId);
      setExecutionId(res.executionId);
      setExecutionStatus('running');
      setExecutionStoreStatus('running');
      setRightPanel('execution');
      success('工作流已开始运行');
    },
    [
      initNodeStates,
      nodes,
      setExecutionId,
      setExecutionStatus,
      setExecutionStoreId,
      setExecutionStoreStatus,
      setInputValues,
      setRightPanel,
      setWorkflowMeta,
      success,
      workflowId,
      workflowName,
    ],
  );

  const handleRun = useCallback(
    async (inputs: Record<string, unknown>) => {
      try {
        await startExecutionFlow(inputs);
      } catch {
        resetExecution();
        setExecutionStatus('idle');
        setExecutionId(null);
        toastError('运行失败');
      }
    },
    [resetExecution, setExecutionId, setExecutionStatus, startExecutionFlow, toastError],
  );

  const handleStop = useCallback(async () => {
    if (!executionId) return;
    try {
      wsSend({
        type: 'stop_execution',
        data: { executionId },
      } satisfies WSClientMessage);
      await executionService.stopExecution(executionId);
      useExecutionStore.getState().setStopped();
      setExecutionStatus('failed');
      success('执行已停止');
    } catch {
      toastError('停止执行失败');
    }
  }, [executionId, setExecutionStatus, success, toastError, wsSend]);

  const sendReview = useCallback(
    (message: WSReviewActionMessage) => {
      wsSend(message);
    },
    [wsSend],
  );

  const handleRetry = useCallback(() => {
    setRetryOpen(true);
  }, []);

  const handleLoadVersion = useCallback(
    async (version: number) => {
      if (!workflowId) return;
      try {
        const data = await workflowService.getVersion(workflowId, version);
        loadFromWorkflow(
          data.id,
          data.name,
          data.description,
          data.nodes,
          data.edges,
          data.current_version,
        );
        pushHistory();
        success(`已加载 v${version}`);
      } catch {
        toastError('版本数据加载失败');
      }
    },
    [loadFromWorkflow, pushHistory, success, toastError, workflowId],
  );

  const startNode = nodes.find((n) => n.type === 'start');
  const retryInputVariables =
    (startNode?.data.config.inputVariables as {
      name: string;
      type: string;
      required?: boolean;
      description?: string;
      default?: string;
    }[]) ?? [];

  if (isLoading || id === 'new') {
    return (
      <div className="workflow-editor workflow-editor--loading">
        <Skeleton height={48} />
        <div className="workflow-editor__loading-body">
          <Skeleton width={260} />
          <Skeleton />
          <Skeleton width={320} />
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-editor">
      <WorkflowToolbar
        onSave={handleSave}
        onRun={handleRun}
        onStop={handleStop}
        onLoadVersion={handleLoadVersion}
        onToggleVersionSidebar={() => setVersionSidebarOpen((v) => !v)}
        onOpenSaveAsTemplate={() => setSaveAsTemplateOpen(true)}
      />
      <div className="workflow-editor__body">
        <NodeLibrary />
        <WorkflowCanvas />
        {versionSidebarOpen && workflowId ? (
          <VersionSidebar
            open={versionSidebarOpen}
            onClose={() => setVersionSidebarOpen(false)}
            workflowId={workflowId}
            currentVersionNumber={currentVersionNumber}
          />
        ) : (
          <RightPanelContainer
            onRetry={handleRetry}
            onStop={handleStop}
            sendReview={sendReview}
            wsSend={wsSend}
          />
        )}
      </div>
      <WorkflowStatusBar />
      <ContextMenu />

      <RunConfigModal
        open={retryOpen}
        onClose={() => setRetryOpen(false)}
        inputVariables={retryInputVariables}
        onStart={async (values) => {
          resetExecution();
          await handleRun(values);
        }}
      />

      {workflowId ? (
        <SaveAsTemplateModal
          open={saveAsTemplateOpen}
          onClose={() => setSaveAsTemplateOpen(false)}
          workflowId={workflowId}
          defaultName={workflowName}
        />
      ) : null}

      {blocker.state === 'blocked' ? (
        <Modal open onClose={() => blocker.reset?.()} title="未保存的更改" size="sm">
          <p>你还有未保存的更改，确定要离开吗？</p>
          <div className="workflow-leave-modal__actions">
            <Button variant="ghost" onClick={() => blocker.reset?.()}>
              取消
            </Button>
            <Button variant="danger" onClick={() => blocker.proceed?.()}>
              离开
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
