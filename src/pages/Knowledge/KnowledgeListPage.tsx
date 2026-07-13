import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpen, Plus, Search } from 'lucide-react';
import { KnowledgeBaseCard } from '@/components/knowledge/KnowledgeBaseCard';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import {
  validateKnowledgeBaseDescription,
  validateKnowledgeBaseName,
} from '@/lib/knowledgeUtils';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/validation';
import { knowledgeService } from '@/services/knowledgeService';
import type { KnowledgeBase } from '@/types';
import '@/styles/knowledge.css';
import '@/styles/phase2.css';

export default function KnowledgeListPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createErrors, setCreateErrors] = useState<{ name?: string; description?: string }>({});
  const [isCreating, setIsCreating] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: '',
    name: '',
    documentCount: 0,
    isDeleting: false,
  });

  const debouncedSearch = useDebounce(searchQuery);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await knowledgeService.getList();
      setKnowledgeBases(res.knowledge_bases);
    } catch {
      setLoadError(true);
      toastError('加载知识库列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void fetchList();
  }, [fetchList]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return knowledgeBases;
    const q = debouncedSearch.toLowerCase();
    return knowledgeBases.filter(
      (kb) =>
        kb.name.toLowerCase().includes(q) ||
        kb.description?.toLowerCase().includes(q),
    );
  }, [knowledgeBases, debouncedSearch]);

  const openCreate = () => {
    setCreateName('');
    setCreateDesc('');
    setCreateErrors({});
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    const nameErr = validateKnowledgeBaseName(createName);
    const descErr = validateKnowledgeBaseDescription(createDesc);
    if (nameErr || descErr) {
      setCreateErrors({ name: nameErr, description: descErr });
      return;
    }

    setIsCreating(true);
    try {
      const kb = await knowledgeService.create({
        name: createName.trim(),
        description: createDesc.trim() || undefined,
      });
      success('知识库创建成功');
      setCreateOpen(false);
      navigate(`/knowledge/${kb.id}`);
    } catch (err) {
      if (getApiErrorStatus(err) === 409) {
        setCreateErrors({ name: '已存在同名知识库' });
      } else {
        toastError(getApiErrorMessage(err, '创建失败，请重试'));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    setDeleteModal((m) => ({ ...m, isDeleting: true }));
    try {
      await knowledgeService.delete(deleteModal.id);
      success('知识库已删除');
      setDeleteModal({ open: false, id: '', name: '', documentCount: 0, isDeleting: false });
      void fetchList();
    } catch (err) {
      toastError(getApiErrorMessage(err, '删除失败'));
      setDeleteModal((m) => ({ ...m, isDeleting: false }));
    }
  };

  if (loadError && !isLoading && knowledgeBases.length === 0) {
    return (
      <div className="knowledge-page">
        <EmptyState
          icon={<AlertTriangle size={48} />}
          title="加载失败"
          action={{ label: '重试', onClick: () => void fetchList() }}
        />
      </div>
    );
  }

  return (
    <div className="knowledge-page">
      <div className="phase2-header">
        <div>
          <h1 className="phase2-header__title">知识库</h1>
          <p className="phase2-header__desc">管理你的 RAG 知识库，上传文档用于 Agent 检索</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
          创建知识库
        </Button>
      </div>

      <div className="phase2-toolbar">
        <div className="phase2-toolbar__search">
          <Input
            size="md"
            fullWidth
            leftIcon={<Search size={16} />}
            placeholder="搜索知识库..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="knowledge-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={200} />
          ))}
        </div>
      ) : filtered.length === 0 && !debouncedSearch ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="还没有知识库"
          description="创建一个知识库开始使用 RAG，上传文档后 Agent 可以从中检索相关知识。"
          action={{ label: '创建知识库', onClick: openCreate }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title="未找到匹配的知识库"
          description="尝试更换关键词搜索"
        />
      ) : (
        <div className="knowledge-grid">
          {filtered.map((kb, i) => (
            <KnowledgeBaseCard
              key={kb.id}
              knowledgeBase={kb}
              className="knowledge-grid-item"
              style={{ animationDelay: `${i * 50}ms` }}
              onOpen={(id) => navigate(`/knowledge/${id}`)}
              onDelete={(id, name, documentCount) =>
                setDeleteModal({ open: true, id, name, documentCount, isDeleting: false })
              }
            />
          ))}
          <button type="button" className="knowledge-create-card knowledge-grid-item" onClick={openCreate}>
            <Plus size={24} className="knowledge-create-card__icon" />
            <span className="knowledge-create-card__label">创建新知识库</span>
          </button>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="创建知识库"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              loading={isCreating}
              disabled={!createName.trim() || isCreating}
              onClick={() => void handleCreate()}
            >
              创建
            </Button>
          </>
        }
      >
        <Input
          label="名称 *"
          size="md"
          fullWidth
          placeholder="输入知识库名称"
          value={createName}
          error={createErrors.name}
          helperText="给知识库起一个易于识别的名称"
          onChange={(e) => setCreateName(e.target.value)}
        />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <label className="phase2-field-label" htmlFor="kb-desc">
            描述
          </label>
          <textarea
            id="kb-desc"
            className={`knowledge-textarea ${createErrors.description ? 'knowledge-textarea--error' : ''}`}
            placeholder="简要描述知识库的用途（可选）"
            value={createDesc}
            onChange={(e) => setCreateDesc(e.target.value)}
          />
          {createErrors.description && (
            <p className="phase2-field-error">{createErrors.description}</p>
          )}
          <p className="phase2-field-helper">可选，简要描述知识库的用途</p>
        </div>
      </Modal>

      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() =>
          setDeleteModal({ open: false, id: '', name: '', documentCount: 0, isDeleting: false })
        }
        onConfirm={() => void handleDelete()}
        title="删除知识库"
        description={`确定要删除知识库「${deleteModal.name}」吗？该知识库中的所有文档和向量数据将被永久删除。`}
        warningText={
          deleteModal.documentCount > 0
            ? `该知识库包含 ${deleteModal.documentCount} 个文档，删除后不可恢复。`
            : undefined
        }
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
}
