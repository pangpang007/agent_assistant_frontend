import { FileText, RotateCw, Table, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { formatFileSize, formatRelativeTime, getFileIconKind } from '@/lib/knowledgeUtils';
import type { KnowledgeDocument } from '@/types';
import { cn } from '@/lib/utils';
import './DocumentListItem.css';

function FileTypeIcon({ filename }: { filename: string }) {
  const kind = getFileIconKind(filename);
  const Icon = kind === 'csv' ? Table : FileText;
  return <Icon size={16} className={cn('doc-row__file-icon', `doc-row__file-icon--${kind}`)} />;
}

export interface DocumentListItemProps {
  document: KnowledgeDocument;
  onDelete: (docId: string) => void;
  onRetry: (docId: string) => void;
  isRetrying?: boolean;
}

export function DocumentListItem({ document, onDelete, onRetry, isRetrying = false }: DocumentListItemProps) {
  const doc = document;

  return (
    <div className="doc-row knowledge-doc-row">
      <div className="doc-row__name">
        <FileTypeIcon filename={doc.filename} />
        <span title={doc.filename}>{doc.filename}</span>
      </div>
      <span className="doc-row__size">{formatFileSize(doc.file_size)}</span>
      <span className="doc-row__chunks">{doc.chunk_count ?? '--'}</span>
      <span className="doc-row__status">
        <DocumentStatusBadge status={doc.status} />
      </span>
      <span className="doc-row__time">{formatRelativeTime(doc.created_at)}</span>
      <div className="doc-row__actions">
        {doc.status === 'ready' && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            className="doc-row__delete"
            aria-label={`删除 ${doc.filename}`}
            onClick={() => onDelete(doc.id)}
          >
            删除
          </Button>
        )}
        {doc.status === 'processing' && <span className="doc-row__dash">—</span>}
        {doc.status === 'failed' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCw size={14} />}
              loading={isRetrying}
              onClick={() => onRetry(doc.id)}
            >
              重试
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              className="doc-row__delete"
              onClick={() => onDelete(doc.id)}
            >
              删除
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
