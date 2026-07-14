import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Plus, Search, Upload } from 'lucide-react';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';
import { ImportModal } from '@/components/workflow/ImportModal';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';
import { ListPagination } from '@/components/common/ListPagination';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { FormSelect } from '@/components/shared/FormSelect';
import { Skeleton } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { workflowService } from '@/services/workflowService';
import { handleApiError } from '@/utils/apiErrorHandler';
import { useWorkflowListPage } from './hooks';
import '@/styles/workflow.css';
import '@/styles/phase2.css';

export default function WorkflowListPage() {
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const {
    items,
    total,
    page,
    pageSize,
    sortBy,
    loading,
    isEmpty,
    loadError,
    searchInput,
    setPage,
    setSort,
    safeFetch,
    handleSearchChange,
    handleCreate,
    handleRename,
    handleDuplicate,
    handleDelete,
  } = useWorkflowListPage();

  const [importOpen, setImportOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: '',
    name: '',
    isDeleting: false,
  });

  const handleExport = async (id: string) => {
    try {
      const data = await workflowService.export(id);
      const wf = items.find((w) => w.id === id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${wf?.name ?? 'workflow'}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      handleApiError(error, '导出工作流');
      toastError('导出失败');
    }
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await handleDelete(deleteModal.id);
      setDeleteModal({ open: false, id: '', name: '', isDeleting: false });
    } catch {
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="workflow-list-page">
      <div className="workflow-list-page__header">
        <div>
          <h1 className="workflow-list-page__title">工作流</h1>
          <p className="workflow-list-page__subtitle">创建和管理 AI 工作流</p>
        </div>
        <div className="workflow-list-page__actions">
          <Button variant="ghost" leftIcon={<Upload size={16} />} onClick={() => setImportOpen(true)}>
            导入
          </Button>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => void handleCreate()}>
            新建
          </Button>
        </div>
      </div>

      <div className="workflow-list-page__toolbar">
        <Input
          placeholder="搜索工作流..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          leftIcon={<Search size={16} />}
        />
        <FormSelect
          value={sortBy}
          options={[
            { value: 'updated_at', label: '更新时间' },
            { value: 'created_at', label: '创建时间' },
            { value: 'name', label: '名称' },
          ]}
          onChange={(v) => setSort(v, 'desc')}
        />
      </div>

      {loading ? (
        <div className="workflow-list-page__grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={200} />
          ))}
        </div>
      ) : loadError ? (
        <EmptyState
          title="加载失败"
          description="请稍后重试"
          action={{ label: '重试', onClick: () => void safeFetch() }}
        />
      ) : isEmpty ? (
        <EmptyState
          icon={<GitBranch size={40} />}
          title="还没有工作流"
          description="创建第一个工作流开始编排"
          action={{ label: '新建工作流', onClick: () => void handleCreate() }}
        />
      ) : (
        <>
          <div className="workflow-list-page__grid">
            {items.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onEdit={(wfId) => navigate(`/workflows/${wfId}`)}
                onRun={(wfId) => navigate(`/workflows/${wfId}`)}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
                onDelete={(wfId, name) =>
                  setDeleteModal({ open: true, id: wfId, name, isDeleting: false })
                }
              />
            ))}
            <Card
              hoverable
              padding="md"
              className="workflow-card workflow-card--create"
              onClick={() => void handleCreate()}
            >
              <Plus size={32} />
              <span>新建工作流</span>
            </Card>
          </div>
          <ListPagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </>
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      <DeleteConfirmModal
        open={deleteModal.open}
        title="删除工作流"
        description={`确定删除工作流「${deleteModal.name}」吗？此操作不可撤销。`}
        isDeleting={deleteModal.isDeleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteModal({ open: false, id: '', name: '', isDeleting: false })}
      />
    </div>
  );
}
