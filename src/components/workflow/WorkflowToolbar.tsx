import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  History,
  LayoutGrid,
  LayoutTemplate,
  Play,
  Redo2,
  Save,
  Square,
  Undo2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { RunConfigModal } from '@/components/workflow/execution/RunConfigModal';
import { StopConfirmModal } from '@/components/workflow/execution/StopConfirmModal';
import { workflowService } from '@/services/workflowService';
import { isExecutionActive, useExecutionStore } from '@/stores/executionStore';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import { ImportModal } from './ImportModal';
import { VersionSelector } from './VersionSelector';

interface WorkflowToolbarProps {
  onSave: () => Promise<void>;
  onRun: (inputs: Record<string, unknown>) => Promise<void>;
  onStop: () => Promise<void>;
  onLoadVersion: (version: number) => Promise<void>;
  onToggleVersionSidebar?: () => void;
  onOpenSaveAsTemplate?: () => void;
}

export function WorkflowToolbar({
  onSave,
  onRun,
  onStop,
  onLoadVersion,
  onToggleVersionSidebar,
  onOpenSaveAsTemplate,
}: WorkflowToolbarProps) {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const workflowName = useWorkflowEditorStore((s) => s.workflowName);
  const isDirty = useWorkflowEditorStore((s) => s.isDirty);
  const isSaving = useWorkflowEditorStore((s) => s.isSaving);
  const workflowId = useWorkflowEditorStore((s) => s.workflowId);
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const undo = useWorkflowEditorStore((s) => s.undo);
  const redo = useWorkflowEditorStore((s) => s.redo);
  const canUndo = useWorkflowEditorStore((s) => s.canUndo);
  const canRedo = useWorkflowEditorStore((s) => s.canRedo);
  const applyAutoLayout = useWorkflowEditorStore((s) => s.applyAutoLayout);
  const pushHistory = useWorkflowEditorStore((s) => s.pushHistory);
  const setRightPanel = useWorkflowEditorStore((s) => s.setRightPanel);
  const updateWorkflowName = useWorkflowEditorStore((s) => s.setWorkflowMeta);
  const runValidation = useWorkflowEditorStore((s) => s.runValidation);
  const validationIssues = useWorkflowEditorStore((s) => s.validationIssues);

  const executionStatus = useExecutionStore((s) => s.status);
  const executing = isExecutionActive(executionStatus);

  const [nameEditing, setNameEditing] = useState(false);
  const [nameValue, setNameValue] = useState(workflowName);
  const [importOpen, setImportOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);

  const startNode = nodes.find((n) => n.type === 'start');
  const inputVariables = useMemo(() => {
    const raw =
      (startNode?.data.config.inputVariables as {
        name: string;
        type: string;
        required?: boolean;
        description?: string;
        default?: string;
      }[]) ?? [];
    return raw;
  }, [startNode]);

  const validationErrors = useMemo(
    () => validationIssues.filter((i) => i.level === 'error'),
    [validationIssues],
  );
  const runDisabled = validationErrors.length > 0;

  const handleExport = async () => {
    if (!workflowId) return;
    try {
      const data = await workflowService.export(workflowId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflowName}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
      success('导出成功');
    } catch {
      toastError('导出失败');
    }
  };

  const openRunModal = () => {
    const issues = runValidation();
    const errors = issues.filter((i) => i.level === 'error');
    if (errors.length > 0) {
      toastError(`校验失败：${errors[0].message}`);
      return;
    }
    setRunOpen(true);
  };

  const handleRun = async (inputs: Record<string, unknown>) => {
    await onRun(inputs);
    setRightPanel('execution');
  };

  const handleStop = async () => {
    setStopLoading(true);
    try {
      await onStop();
      setStopOpen(false);
    } finally {
      setStopLoading(false);
    }
  };

  const commitName = useCallback(async () => {
    setNameEditing(false);
    if (!workflowId || nameValue === workflowName) return;
    try {
      await workflowService.update(workflowId, { name: nameValue });
      updateWorkflowName(workflowId, nameValue);
    } catch {
      toastError('重命名失败');
      setNameValue(workflowName);
    }
  }, [nameValue, toastError, updateWorkflowName, workflowId, workflowName]);

  return (
    <>
      <header className="workflow-toolbar">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/workflows')}>
          返回
        </Button>

        {nameEditing ? (
          <Input
            size="sm"
            className="workflow-toolbar__name-input"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={() => void commitName()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void commitName();
            }}
          />
        ) : (
          <button
            type="button"
            className="workflow-toolbar__name"
            onClick={() => {
              setNameValue(workflowName);
              setNameEditing(true);
            }}
          >
            {workflowName}
          </button>
        )}

        <div className="workflow-toolbar__divider" />

        <Button variant="ghost" size="sm" leftIcon={<Upload size={16} />} onClick={() => setImportOpen(true)}>
          导入
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<Download size={16} />} onClick={() => void handleExport()}>
          导出
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<LayoutTemplate size={16} />}
          disabled={!workflowId || executing}
          onClick={onOpenSaveAsTemplate}
        >
          另存为模板
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<History size={16} />}
          disabled={!workflowId || executing}
          onClick={onToggleVersionSidebar}
        >
          版本历史
        </Button>

        <div className="workflow-toolbar__divider" />

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Undo2 size={16} />}
          disabled={!canUndo() || executing}
          onClick={undo}
          aria-label="撤销"
        >
          {' '}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Redo2 size={16} />}
          disabled={!canRedo() || executing}
          onClick={redo}
          aria-label="重做"
        >
          {' '}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<LayoutGrid size={16} />}
          disabled={executing}
          onClick={() => {
            applyAutoLayout();
            pushHistory();
          }}
        >
          自动布局
        </Button>

        <div className="workflow-toolbar__spacer" />

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Save size={16} />}
          loading={isSaving}
          disabled={executing}
          onClick={() => void onSave()}
        >
          保存{isDirty ? ' •' : ''}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Play size={16} />}
          disabled={executing}
          onClick={() => setRightPanel('debug')}
        >
          测试
        </Button>
        {executing ? (
          <Button variant="danger" size="sm" leftIcon={<Square size={16} />} onClick={() => setStopOpen(true)}>
            停止
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Play size={16} />}
            disabled={runDisabled}
            title={runDisabled ? validationErrors[0]?.message : undefined}
            onClick={openRunModal}
          >
            运行
          </Button>
        )}

        <VersionSelector onSelectVersion={(v) => void onLoadVersion(v)} />
      </header>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      <RunConfigModal
        open={runOpen}
        onClose={() => setRunOpen(false)}
        inputVariables={inputVariables}
        onStart={handleRun}
      />

      <StopConfirmModal
        open={stopOpen}
        onClose={() => setStopOpen(false)}
        onConfirm={handleStop}
        loading={stopLoading}
      />
    </>
  );
}
