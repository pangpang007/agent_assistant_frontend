import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { SecretMask } from '@/components/env/SecretMask';
import { EnvVarFormModal } from '@/components/env/EnvVarFormModal';
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, type Column } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/utils/apiErrorHandler';
import { useEnvListPage } from './env/hooks';
import type { EnvVariable } from '@/types/phase6';
import '@/styles/phase2.css';
import '@/styles/phase6.css';

export default function EnvVarsPage() {
  const { success } = useToast();
  const listPage = useEnvListPage();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EnvVariable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnvVariable | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async (values: Parameters<typeof listPage.create>[0]) => {
    try {
      await listPage.create(values);
      success('环境变量已创建');
    } catch (error) {
      handleApiError(error, '创建环境变量');
      throw error;
    }
  };

  const handleUpdate = async (values: Parameters<typeof listPage.create>[0]) => {
    if (!editing) return;
    try {
      const patch: Partial<typeof values> = { type: values.type };
      if (values.value) patch.value = values.value;
      await listPage.update(editing.id, patch);
      success('环境变量已更新');
    } catch (error) {
      handleApiError(error, '更新环境变量');
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await listPage.remove(deleteTarget.id);
      success('已删除');
      setDeleteTarget(null);
    } catch (error) {
      handleApiError(error, '删除环境变量');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<EnvVariable>[] = [
    {
      key: 'key',
      title: '变量名',
      dataIndex: 'key',
      render: (v) => <span className="phase6-mono">{String(v)}</span>,
    },
    {
      key: 'type',
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (v) => (
        <Tag color={v === 'secret' ? 'warning' : 'default'}>
          {v === 'secret' ? 'Secret' : '字符串'}
        </Tag>
      ),
    },
    {
      key: 'value',
      title: '值',
      dataIndex: 'value',
      render: (v, record) =>
        record.type === 'secret' ? <SecretMask value={String(v)} /> : <span>{String(v)}</span>,
    },
    {
      key: 'updated_at',
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 180,
      render: (v) => (
        <span className="phase6-mono">{format(parseISO(String(v)), 'yyyy-MM-dd HH:mm:ss')}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id',
      width: 140,
      render: (_v, record) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }} onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(record);
              setFormOpen(true);
            }}
          >
            编辑
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(record)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="phase2-page">
      <div className="phase2-header">
        <div>
          <h1 className="phase2-header__title">环境变量</h1>
          <p className="phase2-header__desc">管理工作流运行时使用的环境变量，Secret 类型将加密存储</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          新建变量
        </Button>
      </div>

      {!listPage.loading && listPage.isEmpty ? (
        <EmptyState
          title="暂无环境变量"
          description="创建环境变量供工作流节点引用"
          action={{
            label: '新建变量',
            onClick: () => {
              setEditing(null);
              setFormOpen(true);
            },
          }}
        />
      ) : (
        <Table
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          data={listPage.items as unknown as Record<string, unknown>[]}
          rowKey="id"
          loading={listPage.loading}
          emptyText="暂无环境变量"
          pagination={{
            current: listPage.page,
            pageSize: listPage.pageSize,
            total: listPage.total,
            onChange: (p) => listPage.setPage(p),
          }}
        />
      )}

      <EnvVarFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="删除环境变量"
        description={`确定删除「${deleteTarget?.key ?? ''}」吗？引用该变量的工作流可能无法正常运行。`}
        isDeleting={deleting}
      />
    </div>
  );
}
