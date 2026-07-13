import { ArrowRight, BookOpen, Calendar, FileText, HardDrive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate, formatFileSize } from '@/lib/knowledgeUtils';
import type { KnowledgeBase } from '@/types';
import { cn } from '@/lib/utils';
import './KnowledgeBaseCard.css';

export interface KnowledgeBaseCardProps {
  knowledgeBase: KnowledgeBase;
  onOpen: (id: string) => void;
  onDelete: (id: string, name: string, documentCount: number) => void;
  style?: React.CSSProperties;
  className?: string;
}

export function KnowledgeBaseCard({
  knowledgeBase,
  onOpen,
  onDelete,
  style,
  className,
}: KnowledgeBaseCardProps) {
  const kb = knowledgeBase;

  return (
    <Card hoverable padding="md" className={cn('kb-card', className)} style={style}>
      <div className="kb-card__header">
        <div className="kb-card__icon">
          <BookOpen size={20} strokeWidth={1.5} />
        </div>
        <span className="kb-card__name">{kb.name}</span>
      </div>

      {kb.description && <p className="kb-card__desc">{kb.description}</p>}

      <div className="kb-card__meta">
        <span>
          <FileText size={12} /> {kb.document_count} 个文档
        </span>
        <span>
          <HardDrive size={12} /> {formatFileSize(kb.total_size)}
        </span>
        <span>
          <Calendar size={12} /> {formatDate(kb.created_at)}
        </span>
      </div>

      <div className="kb-card__divider" />

      <div className="kb-card__actions">
        <Button variant="secondary" size="sm" leftIcon={<ArrowRight size={14} />} onClick={() => onOpen(kb.id)}>
          打开
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={14} />}
          className="kb-card__delete"
          onClick={() => onDelete(kb.id, kb.name, kb.document_count)}
        >
          删除
        </Button>
      </div>
    </Card>
  );
}
