import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  HardDrive,
  Settings2,
  Trash2,
} from 'lucide-react';
import { ChunkConfigPanel } from '@/components/knowledge/ChunkConfigPanel';
import { DocumentListItem } from '@/components/knowledge/DocumentListItem';
import { FileUploader } from '@/components/knowledge/FileUploader';
import { RetrievalTestPanel } from '@/components/knowledge/RetrievalTestPanel';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { formatFileSize } from '@/lib/knowledgeUtils';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/validation';
import { knowledgeService } from '@/services/knowledgeService';
import type { KnowledgeBase, KnowledgeDocument } from '@/types';
import '@/styles/knowledge.css';
import '@/styles/phase2.css';

export default function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deleteKbOpen, setDeleteKbOpen] = useState(false);
  const [isDeletingKb, setIsDeletingKb] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  const fetchKb = useCallback(async () => {
    if (!id) return;
    try {
      const data = await knowledgeService.getById(id);
      setKb(data);
    } catch (err) {
      if (getApiErrorStatus(err) === 404) {
        toastError('知识库不存在或已被删除');
        navigate('/knowledge', { replace: true });
      } else {
        toastError(getApiErrorMessage(err, '加载失败'));
      }
    }
  }, [id, navigate, toastError]);

  const fetchDocuments = useCallback(async () => {
    if (!id) return;
    try {
      const res = await knowledgeService.getDocuments(id);
      setDocuments(res.documents);
    } catch (err) {
      if (getApiErrorStatus(err) === 404) {
        toastError('知识库已被删除');
        navigate('/knowledge', { replace: true });
      }
    }
  }, [id, navigate, toastError]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchKb(), fetchDocuments()]);
    setIsLoading(false);
  }, [fetchKb, fetchDocuments]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing');
    if (!hasProcessing || !id) return;

    const timer = window.setInterval(() => {
      void fetchDocuments();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [documents, fetchDocuments, id]);

  const handleDeleteKb = async () => {
    if (!id) return;
    setIsDeletingKb(true);
    try {
      await knowledgeService.delete(id);
      success('知识库已删除');
      navigate('/knowledge', { replace: true });
    } catch (err) {
      toastError(getApiErrorMessage(err, '删除失败'));
      setIsDeletingKb(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!id || !deleteDocId) return;
    setIsDeletingDoc(true);
    try {
      await knowledgeService.deleteDocument(id, deleteDocId);
      success('文档已删除');
      setDeleteDocId(null);
      void fetchDocuments();
      void fetchKb();
    } catch (err) {
      toastError(getApiErrorMessage(err, '删除失败'));
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const handleRetryDoc = async (docId: string) => {
    if (!id) return;
    setRetryingId(docId);
    try {
      await knowledgeService.reprocessDocument(id, docId);
      void fetchDocuments();
    } catch (err) {
      toastError(getApiErrorMessage(err, '重试失败，请检查文件后重新上传'));
    } finally {
      setRetryingId(null);
    }
  };

  if (isLoading || !kb) {
    return (
      <div className="knowledge-page knowledge-detail-page">
        <Skeleton variant="rectangular" height={120} />
        <Skeleton variant="rectangular" height={300} className="knowledge-detail-section" />
      </div>
    );
  }

  return (
    <div className="knowledge-page knowledge-detail-page">
      <button type="button" className="phase2-back" onClick={() => navigate('/knowledge')}>
        <ArrowLeft size={16} /> 返回知识库列表
      </button>

      <Card padding="md" className="knowledge-detail-section">
        <div className="phase2-header" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="kb-card__icon" style={{ width: 48, height: 48 }}>
              <BookOpen size={24} strokeWidth={1.5} />
            </div>
            <h1 className="phase2-header__title">{kb.name}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            className="kb-card__delete"
            onClick={() => setDeleteKbOpen(true)}
          >
            删除
          </Button>
        </div>
        {kb.description && <p className="knowledge-info-desc">{kb.description}</p>}
        <div className="knowledge-info-meta">
          <span>
            <FileText size={16} /> {kb.document_count} 个文档
          </span>
          <span>
            <HardDrive size={16} /> {formatFileSize(kb.total_size)}
          </span>
          <span>
            <Settings2 size={16} /> 块大小 {kb.chunk_size} / 重叠 {kb.chunk_overlap}
          </span>
        </div>
      </Card>

      <Card padding="md" className="knowledge-detail-section">
        <h2 className="knowledge-detail-section__title">文档管理</h2>
        <FileUploader
          knowledgeBaseId={kb.id}
          queueCount={documents.length}
          onUploadComplete={() => {
            void fetchDocuments();
            void fetchKb();
          }}
        />

        {documents.length === 0 ? (
          <div className="knowledge-doc-empty">
            <FileText size={32} />
            <p>暂无文档，上传文件开始构建知识库</p>
          </div>
        ) : (
          <div className="knowledge-doc-list" style={{ marginTop: 'var(--space-4)' }}>
            <div className="knowledge-doc-list-header">
              <span>文件名</span>
              <span>大小</span>
              <span>分块数</span>
              <span>状态</span>
              <span>上传时间</span>
              <span>操作</span>
            </div>
            {documents.map((doc) => (
              <DocumentListItem
                key={doc.id}
                document={doc}
                isRetrying={retryingId === doc.id}
                onDelete={(docId) => setDeleteDocId(docId)}
                onRetry={(docId) => void handleRetryDoc(docId)}
              />
            ))}
          </div>
        )}
      </Card>

      <ChunkConfigPanel
        key={`${kb.id}-${kb.chunk_size}-${kb.chunk_overlap}`}
        knowledgeBaseId={kb.id}
        chunkSize={kb.chunk_size}
        chunkOverlap={kb.chunk_overlap}
        onConfigSaved={(newSize, newOverlap) => {
          setKb((prev) =>
            prev ? { ...prev, chunk_size: newSize, chunk_overlap: newOverlap } : prev,
          );
        }}
      />

      <RetrievalTestPanel knowledgeBaseId={kb.id} />

      <DeleteConfirmModal
        open={deleteKbOpen}
        onClose={() => setDeleteKbOpen(false)}
        onConfirm={() => void handleDeleteKb()}
        title="删除知识库"
        description={`确定要删除知识库「${kb.name}」吗？该知识库中的所有文档和向量数据将被永久删除。`}
        warningText={
          kb.document_count > 0
            ? `该知识库包含 ${kb.document_count} 个文档，删除后不可恢复。`
            : undefined
        }
        isDeleting={isDeletingKb}
      />

      <DeleteConfirmModal
        open={Boolean(deleteDocId)}
        onClose={() => setDeleteDocId(null)}
        onConfirm={() => void handleDeleteDoc()}
        title="删除文档"
        description="确定要删除此文档吗？相关的向量数据将被永久删除。"
        isDeleting={isDeletingDoc}
      />
    </div>
  );
}
