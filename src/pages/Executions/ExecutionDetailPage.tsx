import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Spinner';
import { nodeTypes } from '@/components/workflow/nodes';
import { formatCost, formatTokenCount } from '@/lib/validation';
import { useExecutionHistoryStore } from '@/stores/executionHistoryStore';
import type { HistoryExecutionDetail, HistoryNodeResult } from '@/types/phase6';
import type { NodeExecutionStatus, WorkflowEdge, WorkflowNode } from '@/types';
import { ExecutionNodeDetail } from './ExecutionNodeDetail';
import { ExecutionStatusBadge } from './ExecutionStatusBadge';
import { ExecutionTimeline } from './ExecutionTimeline';
import '@/styles/phase2.css';
import '@/styles/phase6.css';

function mapNodeStatus(status: HistoryNodeResult['status']): NodeExecutionStatus {
  switch (status) {
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'running':
      return 'running';
    case 'waiting':
      return 'waiting_review';
    case 'skipped':
      return 'skipped';
    default:
      return 'idle';
  }
}

function buildGraph(detail: HistoryExecutionDetail): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const resultMap = new Map((detail.nodes ?? []).map((n) => [n.node_id, n]));

  if (detail.snapshot_nodes?.length) {
    const nodes = detail.snapshot_nodes.map((node) => {
      const result = resultMap.get(node.id);
      return {
        ...node,
        data: {
          ...node.data,
          executionStatus: result ? mapNodeStatus(result.status) : node.data.executionStatus,
        },
      };
    });
    return { nodes, edges: detail.snapshot_edges ?? [] };
  }

  const nodes: WorkflowNode[] = (detail.nodes ?? []).map((result, index) => ({
    id: result.node_id,
    type: result.node_type,
    position: { x: (index % 4) * 220, y: Math.floor(index / 4) * 120 },
    data: {
      label: result.node_name,
      nodeType: result.node_type as WorkflowNode['data']['nodeType'],
      config: {},
      outputs: [],
      executionStatus: mapNodeStatus(result.status),
    },
  }));

  return { nodes, edges: [] };
}

function ReadonlyCanvas({
  nodes,
  edges,
  onNodeClick,
}: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodeClick: NodeMouseHandler;
}) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      fitView
      onNodeClick={onNodeClick}
      defaultEdgeOptions={{
        type: 'smoothstep',
        style: { stroke: 'var(--border-default)', strokeWidth: 2 },
      }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--border-subtle)" />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}

export default function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detail = useExecutionHistoryStore((s) => s.detail);
  const detailLoading = useExecutionHistoryStore((s) => s.detailLoading);
  const fetchDetail = useExecutionHistoryStore((s) => s.fetchDetail);
  const clearDetail = useExecutionHistoryStore((s) => s.clearDetail);

  const [selectedNode, setSelectedNode] = useState<HistoryNodeResult | null>(null);
  const [nodeModalOpen, setNodeModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    void fetchDetail(id);
    return () => clearDetail();
  }, [id, fetchDetail, clearDetail]);

  const graph = useMemo(() => (detail ? buildGraph(detail) : { nodes: [], edges: [] }), [detail]);
  const nodeResultMap = useMemo(
    () => new Map((detail?.nodes ?? []).map((n) => [n.node_id, n])),
    [detail],
  );

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const result = nodeResultMap.get(node.id);
      if (result) {
        setSelectedNode(result);
        setNodeModalOpen(true);
      }
    },
    [nodeResultMap],
  );

  if (detailLoading || !detail) {
    return (
      <div className="phase2-page">
        <Skeleton height={32} width={200} />
        <Skeleton height={120} />
        <Skeleton height={480} />
      </div>
    );
  }

  const durationLabel =
    detail.total_duration_ms != null
      ? detail.total_duration_ms < 1000
        ? `${detail.total_duration_ms} ms`
        : `${(detail.total_duration_ms / 1000).toFixed(1)} s`
      : '—';

  return (
    <div className="phase2-page phase6-page--wide">
      <button type="button" className="phase2-back" onClick={() => navigate('/executions')}>
        <ArrowLeft size={16} />
        返回执行历史
      </button>

      <div className="phase2-header">
        <div>
          <h1 className="phase2-header__title">{detail.workflow_name}</h1>
          <p className="phase2-header__desc">
            执行 ID: <span className="phase6-mono">{detail.id}</span>
          </p>
        </div>
        <ExecutionStatusBadge status={detail.status} />
      </div>

      <div className="phase6-stats">
        <div className="phase6-stat">
          <div className="phase6-stat__label">版本</div>
          <div className="phase6-stat__value">v{detail.version_number}</div>
        </div>
        <div className="phase6-stat">
          <div className="phase6-stat__label">耗时</div>
          <div className="phase6-stat__value">{durationLabel}</div>
        </div>
        <div className="phase6-stat">
          <div className="phase6-stat__label">Tokens</div>
          <div className="phase6-stat__value">
            {detail.total_tokens != null ? formatTokenCount(detail.total_tokens) : '—'}
          </div>
        </div>
        <div className="phase6-stat">
          <div className="phase6-stat__label">费用</div>
          <div className="phase6-stat__value">
            {detail.total_cost != null ? formatCost(detail.total_cost) : '—'}
          </div>
        </div>
        <div className="phase6-stat">
          <div className="phase6-stat__label">开始时间</div>
          <div className="phase6-stat__value" style={{ fontSize: 'var(--text-sm)' }}>
            {format(parseISO(detail.started_at), 'yyyy-MM-dd HH:mm:ss')}
          </div>
        </div>
      </div>

      <div className="phase6-detail-layout">
        <div className="phase6-canvas-wrap">
          <ReactFlowProvider>
            <ReadonlyCanvas
              nodes={graph.nodes}
              edges={graph.edges}
              onNodeClick={handleNodeClick}
            />
          </ReactFlowProvider>
        </div>
        <Card title="执行日志" padding="md">
          <ExecutionTimeline logs={detail.logs ?? []} />
        </Card>
      </div>

      <ExecutionNodeDetail
        open={nodeModalOpen}
        onClose={() => setNodeModalOpen(false)}
        node={selectedNode}
      />
    </div>
  );
}
