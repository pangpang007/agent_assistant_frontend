import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { workflowService } from '@/services/workflowService';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';

export function DebugPanel() {
  const workflowId = useWorkflowEditorStore((s) => s.workflowId);
  const selectedNodeId = useWorkflowEditorStore((s) => s.selectedNodeId);
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const { error: toastError } = useToast();

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    outputs?: Record<string, unknown>;
    duration?: number;
    error?: string;
  } | null>(null);

  if (!selectedNode) {
    return (
      <EmptyState
        icon={<Play size={32} />}
        title="选中节点进行调试"
        description="在画布上选择一个节点"
      />
    );
  }

  const inputVars = selectedNode.data.outputs.length > 0 ? ['input'] : ['input'];

  const handleExecute = async () => {
    if (!workflowId || !selectedNodeId) return;
    setIsExecuting(true);
    setResult(null);
    try {
      const res = await workflowService.testNode(workflowId, {
        nodeId: selectedNodeId,
        inputs: inputs,
      });
      setResult(res);
    } catch {
      toastError('节点调试失败');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="debug-panel">
      <div className="debug-panel__header">
        <span>调试: {selectedNode.data.label}</span>
      </div>
      <div className="debug-panel__body">
        {inputVars.map((key) => (
          <div key={key} className="panel-field">
            <label className="panel-field__label">{key}</label>
            <Input
              size="sm"
              value={inputs[key] ?? ''}
              onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder="输入模拟数据"
            />
          </div>
        ))}
        <Button
          variant="primary"
          size="md"
          leftIcon={<Play size={16} />}
          loading={isExecuting}
          onClick={() => void handleExecute()}
        >
          执行
        </Button>

        {result ? (
          <div className="debug-panel__result">
            <div className={result.success ? 'debug-panel__success' : 'debug-panel__error'}>
              {result.success ? '✅ 成功' : '❌ 失败'}
            </div>
            {result.duration !== undefined ? (
              <div className="debug-panel__meta">耗时: {result.duration}ms</div>
            ) : null}
            {result.error ? <pre className="debug-panel__output">{result.error}</pre> : null}
            {result.outputs ? (
              <pre className="debug-panel__output">{JSON.stringify(result.outputs, null, 2)}</pre>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
