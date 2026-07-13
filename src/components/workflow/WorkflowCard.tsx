import { Clock, GitBranch, MoreHorizontal, Pencil, Play, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Dropdown } from '@/components/ui/Dropdown';
import type { WorkflowListItem, WorkflowStatus } from '@/types';

interface WorkflowCardProps {
  workflow: WorkflowListItem;
  onEdit: (id: string) => void;
  onRun: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

function statusTag(status: WorkflowStatus) {
  switch (status) {
    case 'published':
      return (
        <Tag color="success">已发布</Tag>
      );
    case 'archived':
      return (
        <Tag color="default">已归档</Tag>
      );
    default:
      return (
        <Tag color="warning">草稿</Tag>
      );
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

export function WorkflowCard({
  workflow,
  onEdit,
  onRun,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
}: WorkflowCardProps) {
  return (
    <Card hoverable padding="md" className="workflow-card">
      <div className="workflow-card__header">
        <h3 className="workflow-card__title">{workflow.name}</h3>
        {statusTag(workflow.status)}
      </div>
      <p className="workflow-card__desc">{workflow.description || '暂无描述'}</p>
      <div className="workflow-card__meta">
        <span>
          <GitBranch size={14} /> {workflow.node_count} 节点
        </span>
        {workflow.edge_count !== undefined ? (
          <span>{workflow.edge_count} 连线</span>
        ) : null}
      </div>
      <div className="workflow-card__meta">
        <span>
          <Clock size={14} /> {formatRelativeTime(workflow.updated_at)}
        </span>
        <span>v{workflow.current_version}</span>
      </div>
      <div className="workflow-card__actions">
        <Button variant="secondary" size="sm" onClick={() => onEdit(workflow.id)}>
          编辑
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<Play size={14} />} onClick={() => onRun(workflow.id)}>
          运行
        </Button>
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm" aria-label="更多操作">
              <MoreHorizontal size={16} />
            </Button>
          }
          align="right"
          items={[
            { key: 'rename', label: '重命名', icon: <Pencil size={14} /> },
            { key: 'duplicate', label: '复制', icon: <GitBranch size={14} /> },
            { key: 'export', label: '导出', icon: <GitBranch size={14} /> },
            { key: 'delete', label: '删除', icon: <Trash2 size={14} />, danger: true },
          ]}
          onSelect={(key) => {
            switch (key) {
              case 'rename': {
                const name = window.prompt('新名称', workflow.name);
                if (name) onRename(workflow.id, name);
                break;
              }
              case 'duplicate':
                onDuplicate(workflow.id);
                break;
              case 'export':
                onExport(workflow.id);
                break;
              case 'delete':
                onDelete(workflow.id, workflow.name);
                break;
              default:
                break;
            }
          }}
        />
      </div>
    </Card>
  );
}
