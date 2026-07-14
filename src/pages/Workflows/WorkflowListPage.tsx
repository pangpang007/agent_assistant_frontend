import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Plus, Search, Upload } from 'lucide-react';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';
import { ImportModal } from '@/components/workflow/ImportModal';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { FormSelect } from '@/components/shared/FormSelect';
import { Skeleton } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { getApiErrorMessage } from '@/lib/validation';
import { workflowService } from '@/services/workflowService';
import type { WorkflowListItem } from '@/types';
import '@/styles/workflow.css';
import '@/styles/phase2.css';

type SortBy = 'updated_at' | 'created_at' | 'name';

export default function WorkflowListPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updated_at');
  const [importOpen, setImportOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: '',
    name: '',
    isDeleting: false,
  });

  const debouncedSearch = useDebounce(searchQuery);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await workflowService.getList({
        search: debouncedSearch || undefined,
        sort_by: sortBy,
        sort_order: 'desc',
      });
      setWorkflows(res?.workflows ?? []);
    } catch {
      setLoadError(true);
      toastError('加载工作流列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, sortBy, toastError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch
    void fetchList();
  }, [fetchList]);

  const filtered = useMemo(() => {
    const list = workflows ?? [];
    if (!debouncedSearch) return list;
    const q = debouncedSearch.toLowerCase();
    return list.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q),
    );
  }, [workflows, debouncedSearch]);

  const handleCreate = async () => {
    try {
      const workflow = await workflowService.create({ name: '未命名工作流' });
      navigate(`/workflows/${workflow.id}`);
    } catch {
      toastError('创建工作流失败');
    }
  };

  const handleRename = async (id: string, name: string) => {
    try {
      await workflowService.update(id, { name });
      success('重命名成功');
      void fetchList();
    } catch (err) {
      toastError(getApiErrorMessage(err, '重命名失败'));
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const workflow = await workflowService.duplicate(id);
      success('复制成功');
      navigate(`/workflows/${workflow.id}`);
    } catch {
      toastError('复制失败');
    }
  };

  const handleExport = async (id: string) => {
    try {
      const data = await workflowService.export(id);
      const wf = workflows.find((w) => w.id === id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${wf?.name ?? 'workflow'}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toastError('导出失败');
    }
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await workflowService.delete(deleteModal.id);
      success('删除成功');
      setDeleteModal({ open: false, id: '', name: '', isDeleting: false });
      void fetchList();
    } catch {
      toastError('删除失败');
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={16} />}
        />
        <FormSelect
          value={sortBy}
          options={[
            { value: 'updated_at', label: '更新时间' },
            { value: 'created_at', label: '创建时间' },
            { value: 'name', label: '名称' },
          ]}
          onChange={(v) => setSortBy(v as SortBy)}
        />
      </div>

      {isLoading ? (
        <div className="workflow-list-page__grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={200} />
          ))}
        </div>
      ) : loadError ? (
        <EmptyState
          title="加载失败"
          description="请稍后重试"
          action={{ label: '重试', onClick: () => void fetchList() }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<GitBranch size={40} />}
          title="还没有工作流"
          description="创建第一个工作流开始编排"
          action={{ label: '新建工作流', onClick: () => void handleCreate() }}
        />
      ) : (
        <div className="workflow-list-page__grid">
          {filtered.map((workflow) => (
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
