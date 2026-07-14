import { useState } from 'react';
import { AlertTriangle, BookOpen, Plus, Search } from 'lucide-react';
import { KnowledgeBaseCard } from '@/components/knowledge/KnowledgeBaseCard';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';
import { ListPagination } from '@/components/common/ListPagination';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Spinner';
import {
  validateKnowledgeBaseDescription,
  validateKnowledgeBaseName,
} from '@/lib/knowledgeUtils';
import { getApiErrorStatus } from '@/lib/validation';
import { useKnowledgeListPage } from './hooks';
import '@/styles/knowledge.css';
import '@/styles/phase2.css';

export default function KnowledgeListPage() {
  const {
    items,
    total,
    page,
    pageSize,
    loading,
    keyword,
    searchInput,
    loadError,
    setPage,
    safeFetch,
    handleSearchChange,
    handleCreate,
    handleDelete,
    navigate,
  } = useKnowledgeListPage();

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

  const openCreate = () => {
    setCreateName('');
    setCreateDesc('');
    setCreateErrors({});
    setCreateOpen(true);
  };

  const onCreate = async () => {
    const nameErr = validateKnowledgeBaseName(createName);
    const descErr = validateKnowledgeBaseDescription(createDesc);
    if (nameErr || descErr) {
      setCreateErrors({ name: nameErr, description: descErr });
      return;
    }
    setIsCreating(true);
    try {
      await handleCreate({
        name: createName.trim(),
        description: createDesc.trim() || undefined,
      });
      setCreateOpen(false);
    } catch (err) {
      if (getApiErrorStatus(err) === 409) {
        setCreateErrors({ name: '已存在同名知识库' });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteModal((m) => ({ ...m, isDeleting: true }));
    try {
      await handleDelete(deleteModal.id);
      setDeleteModal({ open: false, id: '', name: '', documentCount: 0, isDeleting: false });
    } catch {
      setDeleteModal((m) => ({ ...m, isDeleting: false }));
    }
  };

  if (loadError && !loading && items.length === 0) {
    return (
      <div className="knowledge-page">
        <EmptyState
          icon={<AlertTriangle size={48} />}
          title="加载失败"
          action={{ label: '重试', onClick: () => void safeFetch() }}
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
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="knowledge-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={200} />
          ))}
        </div>
      ) : items.length === 0 && !keyword ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="还没有知识库"
          description="创建一个知识库开始使用 RAG，上传文档后 Agent 可以从中检索相关知识。"
          action={{ label: '创建知识库', onClick: openCreate }}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title="未找到匹配的知识库"
          description="尝试更换关键词搜索"
        />
      ) : (
        <>
          <div className="knowledge-grid">
            {items.map((kb, i) => (
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
          <ListPagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </>
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
              onClick={() => void onCreate()}
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
        onConfirm={() => void confirmDelete()}
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
