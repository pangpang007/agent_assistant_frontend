import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  LayoutGrid,
  Play,
  Redo2,
  Save,
  Undo2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { workflowService } from '@/services/workflowService';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import { ImportModal } from './ImportModal';
import { VersionSelector } from './VersionSelector';

interface WorkflowToolbarProps {
  onSave: () => Promise<void>;
  onRun: (inputs: Record<string, unknown>) => Promise<void>;
  onLoadVersion: (version: number) => Promise<void>;
}

export function WorkflowToolbar({ onSave, onRun, onLoadVersion }: WorkflowToolbarProps) {
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

  const [nameEditing, setNameEditing] = useState(false);
  const [nameValue, setNameValue] = useState(workflowName);
  const [importOpen, setImportOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [runInputs, setRunInputs] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);

  const startNode = nodes.find((n) => n.type === 'start');
  const inputVariables =
    (startNode?.data.config.inputVariables as { name: string; type: string }[]) ?? [];

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
    const defaults: Record<string, string> = {};
    inputVariables.forEach((v) => {
      defaults[v.name] = '';
    });
    setRunInputs(defaults);
    setRunOpen(true);
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      await onRun(runInputs);
      setRunOpen(false);
      setRightPanel('execution');
    } finally {
      setIsRunning(false);
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

        <div className="workflow-toolbar__divider" />

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Undo2 size={16} />}
          disabled={!canUndo()}
          onClick={undo}
          aria-label="撤销"
        >
          {' '}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Redo2 size={16} />}
          disabled={!canRedo()}
          onClick={redo}
          aria-label="重做"
        >
          {' '}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<LayoutGrid size={16} />}
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
          onClick={() => void onSave()}
        >
          保存{isDirty ? ' •' : ''}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Play size={16} />}
          onClick={() => setRightPanel('debug')}
        >
          测试
        </Button>
        <Button variant="primary" size="sm" leftIcon={<Play size={16} />} onClick={openRunModal}>
          运行
        </Button>

        <VersionSelector onSelectVersion={(v) => void onLoadVersion(v)} />
      </header>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      <Modal open={runOpen} onClose={() => setRunOpen(false)} title="运行工作流" size="md">
        {inputVariables.length === 0 ? (
          <p className="workflow-run-modal__hint">开始节点未定义输入变量，将直接运行。</p>
        ) : (
          inputVariables.map((v) => (
            <div key={v.name} className="panel-field">
              <label className="panel-field__label">{v.name}</label>
              <Input
                size="sm"
                value={runInputs[v.name] ?? ''}
                onChange={(e) => setRunInputs((prev) => ({ ...prev, [v.name]: e.target.value }))}
              />
            </div>
          ))
        )}
        <div className="workflow-run-modal__actions">
          <Button variant="ghost" onClick={() => setRunOpen(false)}>
            取消
          </Button>
          <Button variant="primary" loading={isRunning} onClick={() => void handleRun()}>
            运行
          </Button>
        </div>
      </Modal>
    </>
  );
}
