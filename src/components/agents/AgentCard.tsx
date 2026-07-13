import { Brain, Copy, Cpu, Eye, Pencil, Trash2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { AgentIcon } from '@/components/phase2/Phase2Icons';
import { MEMORY_STRATEGY_LABELS } from '@/lib/phase2Constants';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';
import './AgentCard.css';

export interface AgentCardProps {
  agent: Agent;
  onView?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isDuplicating?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function AgentCard({
  agent,
  onView,
  onDuplicate,
  onEdit,
  onDelete,
  isDuplicating = false,
  style,
  className,
}: AgentCardProps) {
  const isPreset = agent.type === 'preset';

  return (
    <Card hoverable padding="md" className={cn('agent-card', className)} style={style}>
      <div className="agent-card__header">
        <div className="agent-card__icon">
          <AgentIcon id={agent.id} type={agent.type} />
        </div>
        <span className="agent-card__name">{agent.name}</span>
        <Tag color={isPreset ? 'primary' : 'success'}>{isPreset ? '预置' : '自定义'}</Tag>
      </div>

      <p className="agent-card__desc">{agent.description}</p>

      <div className="agent-card__meta">
        <span>
          <Cpu size={12} /> {agent.model_name}
        </span>
        <span>
          <Wrench size={12} /> {agent.tool_count} 工具
        </span>
        <span>
          <Brain size={12} /> {MEMORY_STRATEGY_LABELS[agent.memory_strategy]}
        </span>
      </div>

      <div className="agent-card__divider" />

      <div className="agent-card__actions">
        {isPreset ? (
          <>
            <Button variant="ghost" size="sm" leftIcon={<Eye size={14} />} onClick={() => onView?.(agent.id)}>
              查看配置
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Copy size={14} />}
              loading={isDuplicating}
              onClick={() => onDuplicate?.(agent.id)}
            >
              复制为自定义
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" leftIcon={<Pencil size={14} />} onClick={() => onEdit?.(agent.id)}>
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              className="agent-card__delete"
              onClick={() => onDelete?.(agent.id)}
            >
              删除
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
