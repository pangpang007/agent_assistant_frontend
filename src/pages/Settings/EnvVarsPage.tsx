import { useCallback, useEffect, useState } from 'react';
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
import { useEnvVarStore } from '@/stores/envVarStore';
import type { EnvVariable } from '@/types/phase6';
import '@/styles/phase2.css';
import '@/styles/phase6.css';

export default function EnvVarsPage() {
  const { success, error: toastError } = useToast();
  const items = useEnvVarStore((s) => s.items);
  const loading = useEnvVarStore((s) => s.loading);
  const fetch = useEnvVarStore((s) => s.fetch);
  const create = useEnvVarStore((s) => s.create);
  const update = useEnvVarStore((s) => s.update);
  const remove = useEnvVarStore((s) => s.remove);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EnvVariable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnvVariable | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const handleCreate = useCallback(
    async (values: Parameters<typeof create>[0]) => {
      try {
        await create(values);
        success('环境变量已创建');
      } catch {
        toastError('创建失败');
        throw new Error('create failed');
      }
    },
    [create, success, toastError],
  );

  const handleUpdate = useCallback(
    async (values: Parameters<typeof create>[0]) => {
      if (!editing) return;
      try {
        const patch: Partial<typeof values> = { type: values.type };
        if (values.value) patch.value = values.value;
        await update(editing.id, patch);
        success('环境变量已更新');
      } catch {
        toastError('更新失败');
        throw new Error('update failed');
      }
    },
    [editing, success, toastError, update],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      success('已删除');
      setDeleteTarget(null);
    } catch {
      toastError('删除失败');
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

      {!loading && items.length === 0 ? (
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
          data={items as unknown as Record<string, unknown>[]}
          rowKey="id"
          loading={loading}
          emptyText="暂无环境变量"
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
