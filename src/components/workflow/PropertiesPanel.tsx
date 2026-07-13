import { Bug, MousePointer2, Play } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tag } from '@/components/ui/Tag';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { NodeType, WorkflowNode } from '@/types';
import { DebugPanel } from './DebugPanel';
import { CommonHeader, panelComponents } from './panels';

function renderPanel(type: NodeType, node: WorkflowNode) {
  const PanelComponent = panelComponents[type];
  if (!PanelComponent) return null;
  return <PanelComponent node={node} />;
}

function OutputVariablesSection({ nodeId }: { nodeId: string }) {
  const node = useWorkflowEditorStore((s) => s.nodes.find((n) => n.id === nodeId));
  if (!node || node.data.outputs.length === 0) return null;

  return (
    <div className="properties-panel__outputs">
      <div className="properties-panel__outputs-title">输出变量</div>
      {node.data.outputs.map((output) => (
        <div key={output.name} className="properties-panel__output-item">
          <Tag color="default">{output.type}</Tag>
          <span>{output.name}</span>
        </div>
      ))}
    </div>
  );
}

function ExecutionMonitor() {
  const executionId = useWorkflowEditorStore((s) => s.executionId);
  const executionStatus = useWorkflowEditorStore((s) => s.executionStatus);

  if (!executionId) {
    return (
      <EmptyState
        icon={<Play size={32} />}
        title="暂无执行任务"
        description="点击工具栏「运行」启动工作流"
      />
    );
  }

  return (
    <div className="execution-monitor">
      <p className="execution-monitor__id">执行 ID: {executionId}</p>
      <Tag
        color={
          executionStatus === 'completed'
            ? 'success'
            : executionStatus === 'failed'
              ? 'danger'
              : 'primary'
        }
      >
        {executionStatus === 'running'
          ? '运行中'
          : executionStatus === 'completed'
            ? '已完成'
            : executionStatus === 'failed'
              ? '失败'
              : '等待中'}
      </Tag>
    </div>
  );
}

export function PropertiesPanel() {
  const selectedNodeId = useWorkflowEditorStore((s) => s.selectedNodeId);
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const rightPanel = useWorkflowEditorStore((s) => s.rightPanel);
  const setRightPanel = useWorkflowEditorStore((s) => s.setRightPanel);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <aside className="properties-panel">
      <div className="properties-panel__tabs">
        <button
          type="button"
          className={rightPanel === 'properties' ? 'properties-panel__tab--active' : undefined}
          onClick={() => setRightPanel('properties')}
        >
          属性
        </button>
        <button
          type="button"
          className={rightPanel === 'debug' ? 'properties-panel__tab--active' : undefined}
          onClick={() => setRightPanel('debug')}
        >
          <Bug size={14} /> 调试
        </button>
        <button
          type="button"
          className={rightPanel === 'execution' ? 'properties-panel__tab--active' : undefined}
          onClick={() => setRightPanel('execution')}
        >
          <Play size={14} /> 执行
        </button>
      </div>

      {rightPanel === 'debug' ? (
        <DebugPanel />
      ) : rightPanel === 'execution' ? (
        <div className="properties-panel__body">
          <ExecutionMonitor />
        </div>
      ) : !selectedNode ? (
        <EmptyState
          icon={<MousePointer2 size={32} />}
          title="选中一个节点查看配置"
          description="从画布或节点库中选择节点"
        />
      ) : (
        <>
          <CommonHeader node={selectedNode} />
          <div className="properties-panel__body">
            {renderPanel(selectedNode.type as NodeType, selectedNode)}
          </div>
          <OutputVariablesSection nodeId={selectedNode.id} />
        </>
      )}
    </aside>
  );
}
