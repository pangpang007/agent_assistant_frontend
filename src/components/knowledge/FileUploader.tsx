import { useCallback, useRef, useState } from 'react';
import { FileText, Table, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import {
  MAX_UPLOAD_FILES,
  formatFileSize,
  getFileIconKind,
  validateKnowledgeFile,
} from '@/lib/knowledgeUtils';
import { generateId, cn } from '@/lib/utils';
import { knowledgeService } from '@/services/knowledgeService';
import './FileUploader.css';

type QueueStatus = 'pending' | 'uploading' | 'processing' | 'success' | 'error';

interface UploadQueueItem {
  id: string;
  file?: File;
  fileName: string;
  fileSize: number;
  progress: number;
  status: QueueStatus;
  error?: string;
  documentId?: string;
}

export interface FileUploaderProps {
  knowledgeBaseId: string;
  onUploadComplete: () => void;
  maxFiles?: number;
  queueCount?: number;
}

function QueueFileIcon({ filename }: { filename: string }) {
  const kind = getFileIconKind(filename);
  const Icon = kind === 'csv' ? Table : FileText;
  return <Icon size={16} className={cn('upload-queue__icon', `upload-queue__icon--${kind}`)} />;
}

export function FileUploader({
  knowledgeBaseId,
  onUploadComplete,
  maxFiles = MAX_UPLOAD_FILES,
  queueCount = 0,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const { warning, error: toastError } = useToast();

  const activeCount = queue.filter((q) => q.status !== 'success' && q.status !== 'error').length;
  const disabled = queueCount + activeCount >= maxFiles;

  const updateItem = (id: string, patch: Partial<UploadQueueItem>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const pollDocumentStatus = useCallback(
    async (itemId: string, docId: string) => {
      const maxRetries = 60;
      for (let i = 0; i < maxRetries; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const doc = await knowledgeService.getDocument(knowledgeBaseId, docId);
          if (doc.status === 'ready') {
            updateItem(itemId, { status: 'success', progress: 100 });
            onUploadComplete();
            return;
          }
          if (doc.status === 'failed') {
            updateItem(itemId, { status: 'error', error: '处理失败' });
            onUploadComplete();
            return;
          }
        } catch {
          updateItem(itemId, { status: 'error', error: '处理超时' });
          return;
        }
      }
      updateItem(itemId, { status: 'error', error: '处理超时' });
    },
    [knowledgeBaseId, onUploadComplete],
  );

  const uploadFile = useCallback(
    async (item: UploadQueueItem) => {
      if (!item.file) return;
      updateItem(item.id, { status: 'uploading', progress: 0 });
      try {
        const doc = await knowledgeService.uploadDocument(knowledgeBaseId, item.file, (progress) => {
          updateItem(item.id, { progress, status: 'uploading' });
        });
        updateItem(item.id, { status: 'processing', documentId: doc.id, progress: 100 });
        void pollDocumentStatus(item.id, doc.id);
      } catch {
        updateItem(item.id, { status: 'error', error: '上传失败' });
        toastError('网络断开，上传中断');
      }
    },
    [knowledgeBaseId, pollDocumentStatus, toastError],
  );

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    let skippedFormat = 0;
    const newItems: UploadQueueItem[] = [];
    const remaining = maxFiles - queueCount - queue.length;

    for (const file of fileArray.slice(0, Math.max(0, remaining))) {
      const validationError = validateKnowledgeFile(file);
      const item: UploadQueueItem = {
        id: generateId(),
        file: validationError ? undefined : file,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: validationError ? 'error' : 'pending',
        error: validationError,
      };
      if (validationError?.includes('格式')) skippedFormat++;
      newItems.push(item);
    }

    if (fileArray.length > remaining) {
      warning(`${fileArray.length - remaining} 个文件超出上传上限，已跳过`);
    }
    if (skippedFormat > 0) {
      warning(`${skippedFormat} 个文件格式不支持，已跳过`);
    }

    setQueue((prev) => [...prev, ...newItems]);

    newItems
      .filter((item) => item.status === 'pending' && item.file)
      .forEach((item) => void uploadFile(item));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  const completedCount = queue.filter((q) => q.status === 'success' || q.status === 'error').length;
  const allDone = queue.length > 0 && completedCount === queue.length;

  return (
    <div className="file-uploader">
      <div
        className={cn(
          'file-uploader__dropzone',
          isDragOver && 'file-uploader__dropzone--active',
          disabled && 'file-uploader__dropzone--disabled',
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          if (e.dataTransfer.types.includes('Files')) setIsDragOver(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        <Upload size={48} className="file-uploader__icon" />
        <p className="file-uploader__text">
          {isDragOver ? '松开以上传文件' : disabled ? '已达上传上限（10 个文件）' : '拖拽文件到此处，或 '}
          {!disabled && !isDragOver && <span className="file-uploader__link">点击上传</span>}
        </p>
        <p className="file-uploader__hint">支持 PDF、TXT、Markdown、CSV、DOCX</p>
        <p className="file-uploader__hint">单文件最大 50MB，最多同时上传 10 个文件</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.markdown,.csv,.docx"
          aria-label="选择文件上传"
          hidden
          onChange={(e) => {
            if (e.target.files?.length) processFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {queue.length > 0 && (
        <div className="upload-queue">
          <div className="upload-queue__header">
            <span>
              上传中 ({completedCount}/{queue.length})
            </span>
            {allDone && (
              <Button variant="ghost" size="sm" onClick={() => setQueue([])}>
                全部清除
              </Button>
            )}
          </div>
          {queue.map((item) => (
            <div key={item.id} className="upload-queue__item">
              <QueueFileIcon filename={item.fileName} />
              <span className="upload-queue__name">{item.fileName}</span>
              <span className="upload-queue__size">{formatFileSize(item.fileSize)}</span>
              <div className="upload-queue__progress-area">
                {item.status === 'error' ? (
                  <span className="upload-queue__error">✗ {item.error}</span>
                ) : item.status === 'success' ? (
                  <span className="upload-queue__success">完成 ✓</span>
                ) : item.status === 'processing' ? (
                  <span className="upload-queue__processing">
                    <Spinner size="sm" /> 处理中...
                  </span>
                ) : item.status === 'pending' ? (
                  <span className="upload-queue__pending">等待中</span>
                ) : (
                  <>
                    <div className="upload-queue__track">
                      <div className="upload-queue__fill" style={{ width: `${item.progress}%` }} />
                    </div>
                    <span className="upload-queue__pct">{item.progress}%</span>
                  </>
                )}
              </div>
              {(item.status === 'error' || item.status === 'success') && (
                <button
                  type="button"
                  className="upload-queue__remove"
                  aria-label="移除"
                  onClick={() => setQueue((prev) => prev.filter((q) => q.id !== item.id))}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
