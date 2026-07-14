import { useState } from 'react';
import { AlertTriangle, Bot, Plus, Search } from 'lucide-react';
import { AgentCard } from '@/components/agents/AgentCard';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';
import { ListPagination } from '@/components/common/ListPagination';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Spinner';
import { Tag } from '@/components/ui/Tag';
import { useAgentListPage } from './hooks';
import type { AgentType } from '@/types';
import '@/styles/phase2.css';

type TypeFilter = 'all' | AgentType;

export default function AgentListPage() {
  const {
    items,
    total,
    page,
    pageSize,
    loading,
    isEmpty,
    searchInput,
    typeFilter,
    sortKey,
    loadError,
    isDuplicating,
    keyword,
    setPage,
    safeFetch,
    handleSearchChange,
    setTypeFilter,
    setSortKey,
    handleDuplicate,
    handleDelete,
    navigate,
  } = useAgentListPage();

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const presetAgents = items.filter((a) => a.type === 'preset');
  const customAgents = items.filter((a) => a.type === 'custom');

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await handleDelete(deleteModal.id);
      setDeleteModal({ open: false, id: '', name: '' });
    } catch {
      /* toasted in hook */
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
          <h1 className="phase2-header__title">Agent 管理</h1>
          <p className="phase2-header__desc">创建和管理你的 AI Agent</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/agents/create')}>
          创建 Agent
        </Button>
      </div>

      <div className="phase2-toolbar">
        <div className="phase2-toolbar__search">
          <Input
            size="md"
            fullWidth
            leftIcon={<Search size={16} />}
            placeholder="搜索 Agent..."
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
        <select className="phase2-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="name_asc">名称 A-Z</option>
          <option value="name_desc">名称 Z-A</option>
          <option value="created_at_desc">创建时间（最新）</option>
          <option value="created_at_asc">创建时间（最早）</option>
        </select>
      </div>

      {loading ? (
        <div className="phase2-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={200} />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={keyword ? <Search size={48} /> : <Bot size={48} />}
          title={keyword ? '未找到匹配的 Agent' : '暂无 Agent'}
          description={
            keyword ? '尝试更换关键词搜索' : '创建你的第一个自定义 Agent，或查看预置 Agent 快速开始。'
          }
          action={!keyword ? { label: '创建 Agent', onClick: () => navigate('/agents/create') } : undefined}
        />
      ) : (
        <>
          {(typeFilter === 'all' || typeFilter === 'preset') && presetAgents.length > 0 && (
            <section className="phase2-section">
              <div className="phase2-section__header">
                <h2 className="phase2-section__title">预置 Agent</h2>
                <Tag color="primary">系统内置</Tag>
              </div>
              <div className="phase2-grid">
                {presetAgents.map((agent, i) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className="phase2-grid-item"
                    isDuplicating={isDuplicating === agent.id}
                    onView={(id) => navigate(`/agents/${id}/view`)}
                    onDuplicate={(id) => void handleDuplicate(id)}
                  />
                ))}
              </div>
            </section>
          )}

          {(typeFilter === 'all' || typeFilter === 'custom') && (
            <section className="phase2-section">
              <div className="phase2-section__header">
                <h2 className="phase2-section__title">自定义 Agent</h2>
                <Tag color="success">{customAgents.length} 个</Tag>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={() => navigate('/agents/create')}
                >
                  创建 Agent
                </Button>
              </div>
              {customAgents.length === 0 ? (
                <EmptyState
                  icon={<Bot size={48} />}
                  title="暂无自定义 Agent"
                  action={{ label: '创建 Agent', onClick: () => navigate('/agents/create') }}
                />
              ) : (
                <div className="phase2-grid">
                  {customAgents.map((agent, i) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      style={{ animationDelay: `${i * 50}ms` }}
                      onEdit={(id) => navigate(`/agents/${id}/edit`)}
                      onDelete={(id) => setDeleteModal({ open: true, id, name: agent.name })}
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
        onClose={() => setDeleteModal({ open: false, id: '', name: '' })}
        onConfirm={() => void confirmDelete()}
        title="删除 Agent"
        description={`确定要删除 Agent「${deleteModal.name}」吗？此操作不可撤销。如果有工作流正在使用此 Agent，可能会导致工作流执行失败。`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
