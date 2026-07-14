import { useCallback, useEffect, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { ContextMenu } from '@/components/workflow/ContextMenu';
import { NodeLibrary } from '@/components/workflow/NodeLibrary';
import { PropertiesPanel } from '@/components/workflow/PropertiesPanel';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { WorkflowStatusBar } from '@/components/workflow/WorkflowStatusBar';
import { WorkflowToolbar } from '@/components/workflow/WorkflowToolbar';
import { useWorkflowShortcuts } from '@/hooks/useWorkflowShortcuts';
import { useWorkflowWebSocket } from '@/hooks/useWorkflowWebSocket';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/validation';
import { workflowService } from '@/services/workflowService';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { Workflow } from '@/types';
import '@/styles/workflow.css';

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
  const reset = useWorkflowEditorStore((s) => s.reset);
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const workflowId = useWorkflowEditorStore((s) => s.workflowId);
  const isDirty = useWorkflowEditorStore((s) => s.isDirty);
  const markSaved = useWorkflowEditorStore((s) => s.markSaved);
  const runValidation = useWorkflowEditorStore((s) => s.runValidation);
  const setVersions = useWorkflowEditorStore((s) => s.setVersions);
  const setExecutionId = useWorkflowEditorStore((s) => s.setExecutionId);
  const executionId = useWorkflowEditorStore((s) => s.executionId);
  const pushHistory = useWorkflowEditorStore((s) => s.pushHistory);

  const [isLoading, setIsLoading] = useState(true);

  useWorkflowWebSocket(executionId);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- create bootstrap loading state
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

    reset();
    void loadWorkflow(id);

    return () => {
      cancelled = true;
      reset();
    };
  }, [id, loadWorkflow, navigate, reset, toastError]);

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

  const handleRun = useCallback(
    async (inputs: Record<string, unknown>) => {
      if (!workflowId) return;
      try {
        const res = await workflowService.run(workflowId, { inputs });
        setExecutionId(res.executionId);
        success('工作流已开始运行');
      } catch {
        toastError('运行失败');
      }
    },
    [setExecutionId, success, toastError, workflowId],
  );

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
        onLoadVersion={handleLoadVersion}
      />
      <div className="workflow-editor__body">
        <NodeLibrary />
        <WorkflowCanvas />
        <PropertiesPanel />
      </div>
      <WorkflowStatusBar />
      <ContextMenu />

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
