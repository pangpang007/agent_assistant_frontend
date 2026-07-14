import { useState } from 'react';
import { AlertTriangle, Plus, Search, Wrench } from 'lucide-react';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';
import { ListPagination } from '@/components/common/ListPagination';
import { ToolCard } from '@/components/tools/ToolCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Spinner';
import { Tag } from '@/components/ui/Tag';
import { handleApiError } from '@/utils/apiErrorHandler';
import { useToolListPage } from './hooks';
import type { Tool, ToolType } from '@/types';
import '@/styles/phase2.css';

type TypeFilter = 'all' | ToolType;

export default function ToolListPage() {
  const {
    items,
    total,
    page,
    pageSize,
    loading,
    isEmpty,
    keyword,
    searchInput,
    typeFilter,
    loadError,
    navigate,
    setPage,
    safeFetch,
    handleSearchChange,
    setTypeFilter,
    handleDelete,
    loadReferences,
  } = useToolListPage();

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: '',
    name: '',
    agentCount: 0,
    agentNames: [] as string[],
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewTool, setViewTool] = useState<Tool | null>(null);

  const presetTools = items.filter((t) => t.type === 'preset');
  const customTools = items.filter((t) => t.type === 'custom');

  const openDeleteModal = async (tool: Tool) => {
    try {
      const refs = await loadReferences(tool);
      setDeleteModal({
        open: true,
        id: tool.id,
        name: tool.name,
        agentCount: refs.agentCount,
        agentNames: refs.agentNames,
      });
    } catch (error) {
      handleApiError(error, '获取引用信息');
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await handleDelete(deleteModal.id, deleteModal.agentCount);
      setDeleteModal({ open: false, id: '', name: '', agentCount: 0, agentNames: [] });
    } catch {
      /* toasted */
    } finally {
      setIsDeleting(false);
    }
  };

  if (loadError && !loading && items.length === 0) {
    return (
      <div className="phase2-page">
        <EmptyState
          icon={<AlertTriangle size={48} />}
          title="加载失败"
          action={{ label: '重试', onClick: () => void safeFetch() }}
        />
      </div>
    );
  }

  return (
    <div className="phase2-page">
      <div className="phase2-header">
        <div>
          <h1 className="phase2-header__title">工具管理</h1>
          <p className="phase2-header__desc">管理 Agent 可用的工具和集成</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/tools/create')}>
          创建自定义工具
        </Button>
      </div>

      <div className="phase2-toolbar">
        <div className="phase2-toolbar__search">
          <Input
            size="md"
            fullWidth
            leftIcon={<Search size={16} />}
            placeholder="搜索工具..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <select
          className="phase2-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="all">全部</option>
          <option value="preset">预置</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      {loading ? (
        <div className="phase2-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={180} />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={keyword ? <Search size={48} /> : <Wrench size={48} />}
          title={keyword ? '未找到匹配的工具' : '暂无自定义工具'}
          description={
            keyword
              ? '尝试更换关键词搜索'
              : '预置工具已就绪，你也可以通过 OpenAPI 规范导入自定义工具。'
          }
          action={
            !keyword ? { label: '创建自定义工具', onClick: () => navigate('/tools/create') } : undefined
          }
        />
      ) : (
        <>
          {(typeFilter === 'all' || typeFilter === 'preset') && presetTools.length > 0 && (
            <section className="phase2-section">
              <div className="phase2-section__header">
                <h2 className="phase2-section__title">预置工具</h2>
                <Tag color="primary">系统内置</Tag>
              </div>
              <div className="phase2-grid">
                {presetTools.map((tool, i) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    style={{ animationDelay: `${i * 50}ms` }}
                    onView={() => setViewTool(tool)}
                  />
                ))}
              </div>
            </section>
          )}

          {(typeFilter === 'all' || typeFilter === 'custom') && (
            <section className="phase2-section">
              <div className="phase2-section__header">
                <h2 className="phase2-section__title">自定义工具</h2>
                <Tag color="success">{customTools.length} 个</Tag>
              </div>
              {customTools.length === 0 ? (
                <EmptyState
                  icon={<Wrench size={48} />}
                  title="暂无自定义工具"
                  action={{ label: '创建自定义工具', onClick: () => navigate('/tools/create') }}
                />
              ) : (
                <div className="phase2-grid">
                  {customTools.map((tool, i) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      style={{ animationDelay: `${i * 50}ms` }}
                      onEdit={(id) => navigate(`/tools/${id}/edit`)}
                      onTest={(id) => navigate(`/tools/${id}/test`)}
                      onDelete={() => void openDeleteModal(tool)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
          <ListPagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </>
      )}

      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() =>
          setDeleteModal({ open: false, id: '', name: '', agentCount: 0, agentNames: [] })
        }
        onConfirm={() => void confirmDelete()}
        title="删除工具"
        description={
          deleteModal.agentCount === 0
            ? `确定要删除工具「${deleteModal.name}」吗？此操作不可撤销。`
            : `确定要删除工具「${deleteModal.name}」吗？`
        }
        warningText={
          deleteModal.agentCount > 0
            ? `当前有 ${deleteModal.agentCount} 个 Agent 正在使用此工具。删除后这些 Agent 将无法调用此工具，可能影响工作流执行。确定要删除吗？`
            : undefined
        }
        referenceList={deleteModal.agentNames}
        isDeleting={isDeleting}
      />

      <Modal
        open={Boolean(viewTool)}
        onClose={() => setViewTool(null)}
        title={viewTool?.name}
        description={viewTool?.description}
        size="md"
      >
        {viewTool && (
          <p className="phase2-readonly-value">
            {viewTool.agent_count > 0
              ? `${viewTool.agent_count} 个 Agent 正在使用此预置工具`
              : '暂无 Agent 使用此预置工具'}
          </p>
        )}
      </Modal>
    </div>
  );
}
