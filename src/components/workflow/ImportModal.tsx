import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { workflowService } from '@/services/workflowService';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ImportPreview {
  name: string;
  nodeCount: number;
  edgeCount: number;
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const parseFile = useCallback(async (selected: File) => {
    try {
      const text = await selected.text();
      const json = JSON.parse(text) as {
        name?: string;
        nodes?: unknown[];
        edges?: unknown[];
        metadata?: { nodeCount?: number; edgeCount?: number };
      };
      setFile(selected);
      setPreview({
        name: json.name ?? '未命名工作流',
        nodeCount: json.metadata?.nodeCount ?? json.nodes?.length ?? 0,
        edgeCount: json.metadata?.edgeCount ?? json.edges?.length ?? 0,
      });
    } catch {
      toastError('JSON 文件解析失败');
      reset();
    }
  }, [toastError]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) void parseFile(dropped);
  };

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    try {
      const workflow = await workflowService.import(file);
      success('工作流导入成功');
      handleClose();
      navigate(`/workflows/${workflow.id}`);
    } catch {
      toastError('导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="导入工作流" size="md">
      <div
        className="import-modal__dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') fileInputRef.current?.click();
        }}
      >
        <p>拖拽 JSON 文件到此处，或点击选择文件</p>
        <p className="import-modal__hint">支持 .json 格式</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) void parseFile(selected);
          }}
        />
      </div>

      {preview ? (
        <div className="import-modal__preview">
          <p>名称: {preview.name}</p>
          <p>节点: {preview.nodeCount} 个</p>
          <p>连线: {preview.edgeCount} 条</p>
        </div>
      ) : null}

      <div className="import-modal__actions">
        <Button variant="ghost" onClick={handleClose}>
          取消
        </Button>
        <Button variant="primary" disabled={!file} loading={isImporting} onClick={() => void handleImport()}>
          确认导入
        </Button>
      </div>
    </Modal>
  );
}
