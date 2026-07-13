import { Eye, Pencil, Play, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { ToolIcon } from '@/components/phase2/Phase2Icons';
import { getToolIconBgClass } from '@/lib/phase2Constants';
import { cn } from '@/lib/utils';
import type { Tool } from '@/types';
import './ToolCard.css';

export interface ToolCardProps {
  tool: Tool;
  onEdit?: (id: string) => void;
  onTest?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  style?: React.CSSProperties;
}

export function ToolCard({ tool, onEdit, onTest, onDelete, onView, style }: ToolCardProps) {
  const isPreset = tool.type === 'preset';
  const iconBg = getToolIconBgClass(tool.id, tool.type);

  return (
    <Card hoverable padding="md" className="tool-card" style={style}>
      <div className="tool-card__header">
        <div className={cn('tool-card__icon', iconBg)}>
          <ToolIcon id={tool.id} type={tool.type} />
        </div>
        <span className="tool-card__name">{tool.name}</span>
        <Tag color={isPreset ? 'primary' : 'success'}>{isPreset ? '预置' : '自定义'}</Tag>
      </div>

      <p className="tool-card__desc">{tool.description}</p>

      <div className="tool-card__usage">
        <Users size={12} />
        {tool.agent_count > 0 ? `${tool.agent_count} 个 Agent 正在使用` : '暂无 Agent 使用'}
      </div>

      <div className="tool-card__divider" />

      <div className="tool-card__actions">
        {isPreset ? (
          <Button variant="ghost" size="sm" leftIcon={<Eye size={14} />} onClick={() => onView?.(tool.id)}>
            查看详情
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" leftIcon={<Pencil size={14} />} onClick={() => onEdit?.(tool.id)}>
              编辑
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Play size={14} />} onClick={() => onTest?.(tool.id)}>
              测试
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              className="tool-card__delete"
              onClick={() => onDelete?.(tool.id)}
            >
              删除
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
