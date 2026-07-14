import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import type { NodeExecutionState } from '@/types/execution';
import { formatDuration } from '@/hooks/useExecutionTimer';

interface NodeDetailExpandProps {
  node: NodeExecutionState;
}

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  const { success } = useToast();
  const [open, setOpen] = useState(false);
  const text = data == null ? '—' : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    void navigator.clipboard.writeText(text);
    success('已复制');
  };

  return (
    <div className="node-detail-expand__block">
      <div className="node-detail-expand__block-header">
        <button type="button" onClick={() => setOpen((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'inherit', padding: 0 }}>
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />} {label}
        </button>
        <button type="button" className="node-detail-expand__copy" onClick={handleCopy} aria-label="复制">
          <Copy size={12} />
        </button>
      </div>
      {open ? <pre className="node-detail-expand__pre">{text}</pre> : null}
    </div>
  );
}

export function NodeDetailExpand({ node }: NodeDetailExpandProps) {
  const tokenLine =
    node.tokens != null
      ? `${node.tokens.total_tokens.toLocaleString()} (输入 ${node.tokens.prompt_tokens.toLocaleString()} + 输出 ${node.tokens.completion_tokens.toLocaleString()})`
      : '—';

  return (
    <div className="node-detail-expand">
      {node.duration != null ? (
        <div className="node-detail-expand__row">
          <span className="node-detail-expand__label">耗时:</span>
          <span>{formatDuration(node.duration)}</span>
        </div>
      ) : null}
      {node.tokens ? (
        <div className="node-detail-expand__row">
          <span className="node-detail-expand__label">Token:</span>
          <span>{tokenLine}</span>
        </div>
      ) : null}
      {node.model ? (
        <div className="node-detail-expand__row">
          <span className="node-detail-expand__label">模型:</span>
          <span>{node.model}</span>
        </div>
      ) : null}
      {node.agentName ? (
        <div className="node-detail-expand__row">
          <span className="node-detail-expand__label">Agent:</span>
          <span>{node.agentName}</span>
        </div>
      ) : null}
      {node.error ? (
        <div className="node-detail-expand__row" style={{ color: 'var(--accent-danger)' }}>
          <span className="node-detail-expand__label">错误:</span>
          <span>{node.error}</span>
        </div>
      ) : null}
      <JsonBlock label="输入" data={node.input} />
      <JsonBlock label="输出" data={node.output} />
    </div>
  );
}
