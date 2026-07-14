import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import {
  MEMORY_STRATEGY_LABELS,
  OUTPUT_FORMAT_LABELS,
} from '@/lib/phase2Constants';
import { getApiErrorMessage } from '@/lib/validation';
import { agentService } from '@/services/agentService';
import { toolService } from '@/services/toolService';
import type { Agent, Tool } from '@/types';
import '@/styles/phase2.css';

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setIsLoading(true);
      try {
        const [agentData, toolsData] = await Promise.all([
          agentService.getById(id),
          toolService.getList(),
        ]);
        setAgent(agentData);
        setTools(toolsData.tools ?? []);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleDuplicate = async () => {
    if (!id) return;
    setIsDuplicating(true);
    try {
      await agentService.duplicate(id);
      success('已复制为自定义 Agent');
      navigate('/agents');
    } catch (err) {
      toastError(getApiErrorMessage(err, '复制失败'));
    } finally {
      setIsDuplicating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="phase2-page phase2-page--form">
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  if (notFound || !agent) {
    return (
      <div className="phase2-page">
        <EmptyState
          icon={<AlertTriangle size={48} />}
          title="Agent 不存在"
          action={{ label: '返回 Agent 列表', onClick: () => navigate('/agents') }}
        />
      </div>
    );
  }

  const toolIds = agent.tool_ids ?? [];
  const toolNames = tools.filter((t) => toolIds.includes(t.id)).map((t) => t.name);

  return (
    <div className="phase2-page phase2-page--form">
      <button type="button" className="phase2-back" onClick={() => navigate('/agents')}>
        <ArrowLeft size={16} /> 返回 Agent 列表
      </button>

      <div className="phase2-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 className="phase2-header__title">{agent.name}</h1>
            <Tag color="primary">预置</Tag>
          </div>
          <p className="phase2-header__desc">{agent.description}</p>
        </div>
        <Button variant="secondary" leftIcon={<Copy size={16} />} loading={isDuplicating} onClick={() => void handleDuplicate()}>
          复制为自定义
        </Button>
      </div>

      <Card padding="md" className="phase2-form-section">
        <h2 className="phase2-form-section__title">基本信息</h2>
        <div className="phase2-readonly-label">名称</div>
        <div className="phase2-readonly-value">{agent.name}</div>
        <div className="phase2-readonly-label" style={{ marginTop: 'var(--space-4)' }}>描述</div>
        <div className="phase2-readonly-value">{agent.description}</div>
        <div className="phase2-readonly-label" style={{ marginTop: 'var(--space-4)' }}>角色描述 / System Prompt</div>
        <pre className="phase2-code-block">{agent.system_prompt}</pre>
      </Card>

      <Card padding="md" className="phase2-form-section">
        <h2 className="phase2-form-section__title">模型与工具</h2>
        <div className="phase2-readonly-label">模型</div>
        <div className="phase2-readonly-value">{agent.model_name}</div>
        <div className="phase2-readonly-label" style={{ marginTop: 'var(--space-4)' }}>挂载工具</div>
        <div className="phase2-readonly-value">{toolNames.length ? toolNames.join('、') : '无'}</div>
      </Card>

      <Card padding="md">
        <h2 className="phase2-form-section__title">高级设置</h2>
        <div className="phase2-readonly-label">记忆策略</div>
        <div className="phase2-readonly-value">{MEMORY_STRATEGY_LABELS[agent.memory_strategy]}</div>
        <div className="phase2-readonly-label" style={{ marginTop: 'var(--space-4)' }}>输出格式</div>
        <div className="phase2-readonly-value">{OUTPUT_FORMAT_LABELS[agent.output_format]}</div>
        <div className="phase2-readonly-label" style={{ marginTop: 'var(--space-4)' }}>Temperature</div>
        <div className="phase2-readonly-value">{agent.temperature}</div>
        <div className="phase2-readonly-label" style={{ marginTop: 'var(--space-4)' }}>Max Tokens</div>
        <div className="phase2-readonly-value">{agent.max_tokens}</div>
      </Card>
    </div>
  );
}
