import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { nodeTypes } from '@/components/workflow/nodes';
import { computeVersionDiff, parseGraphJson } from '@/lib/workflow/versionDiff';
import { versionService } from '@/services/versionService';
import type { VersionDiff, VersionRecord } from '@/types/phase6';
import type { WorkflowEdge, WorkflowNode } from '@/types';
import './version-sidebar.css';

export interface VersionDiffViewProps {
  workflowId: string;
  versionA: VersionRecord;
  versionB: VersionRecord;
  onClose: () => void;
}

function resolveGraph(v: VersionRecord): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  if (v.nodes?.length) return { nodes: v.nodes, edges: v.edges ?? [] };
  return parseGraphJson(v.nodes_json, v.edges_json);
}

function applyNodeStyles(
  nodes: WorkflowNode[],
  diff: VersionDiff,
  side: 'old' | 'new',
  dimUnchanged: boolean,
): WorkflowNode[] {
  const addedIds = new Set(diff.added_nodes.map((n) => n.id));
  const removedIds = new Set(diff.removed_nodes.map((n) => n.id));
  const modifiedIds = new Set(diff.modified_nodes.map((n) => n.id));

  return nodes.map((node) => {
    let style: React.CSSProperties = { ...node.style };
    let opacity = 1;

    if (side === 'new' && addedIds.has(node.id)) {
      style = {
        ...style,
        border: '2px solid var(--accent-success)',
        background: 'var(--accent-success-subtle)',
      };
    } else if (side === 'old' && removedIds.has(node.id)) {
      style = {
        ...style,
        border: '2px solid var(--accent-danger)',
        background: 'var(--accent-danger-subtle)',
        opacity: 0.6,
      };
    } else if (modifiedIds.has(node.id)) {
      style = {
        ...style,
        border: '2px solid var(--accent-warning)',
        background: 'var(--accent-warning-subtle)',
      };
    } else if (dimUnchanged) {
      opacity = 0.15;
    }

    return { ...node, style: { ...style, opacity } };
  });
}

function applyEdgeStyles(
  edges: WorkflowEdge[],
  diff: VersionDiff,
  side: 'old' | 'new',
  dimUnchanged: boolean,
): WorkflowEdge[] {
  const addedIds = new Set(diff.added_edges.map((e) => e.id));
  const removedIds = new Set(diff.removed_edges.map((e) => e.id));

  return edges.map((edge) => {
    let style: React.CSSProperties = { strokeWidth: 2, ...(edge.style as React.CSSProperties) };
    let opacity = 1;

    if (side === 'new' && addedIds.has(edge.id)) {
      style = { ...style, stroke: 'var(--accent-success)', strokeWidth: 3 };
    } else if (side === 'old' && removedIds.has(edge.id)) {
      style = {
        ...style,
        stroke: 'var(--accent-danger)',
        strokeDasharray: '5,5',
      };
    } else if (dimUnchanged) {
      opacity = 0.15;
    }

    return { ...edge, style: { ...style, opacity } };
  });
}

function DiffCanvas({ nodes, edges }: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--border-subtle)" />
    </ReactFlow>
  );
}

export function VersionDiffView({ workflowId, versionA, versionB, onClose }: VersionDiffViewProps) {
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [loading, setLoading] = useState(true);

  const graphA = useMemo(() => resolveGraph(versionA), [versionA]);
  const graphB = useMemo(() => resolveGraph(versionB), [versionB]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const remote = await versionService.getDiff(
          workflowId,
          String(versionA.id),
          String(versionB.id),
        );
        if (!cancelled) {
          const hasRemote =
            remote.added_nodes.length +
              remote.removed_nodes.length +
              remote.modified_nodes.length +
              remote.added_edges.length +
              remote.removed_edges.length >
            0;
          setDiff(
            hasRemote
              ? remote
              : computeVersionDiff(graphA.nodes, graphA.edges, graphB.nodes, graphB.edges),
          );
        }
      } catch {
        if (!cancelled) {
          setDiff(computeVersionDiff(graphA.nodes, graphA.edges, graphB.nodes, graphB.edges));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workflowId, versionA, versionB, graphA, graphB]);

  const styledA = useMemo(
    () =>
      diff
        ? {
            nodes: applyNodeStyles(graphA.nodes, diff, 'old', onlyDiff),
            edges: applyEdgeStyles(graphA.edges, diff, 'old', onlyDiff),
          }
        : graphA,
    [diff, graphA, onlyDiff],
  );

  const styledB = useMemo(
    () =>
      diff
        ? {
            nodes: applyNodeStyles(graphB.nodes, diff, 'new', onlyDiff),
            edges: applyEdgeStyles(graphB.edges, diff, 'new', onlyDiff),
          }
        : graphB,
    [diff, graphB, onlyDiff],
  );

  const labelA = (v: VersionRecord) => {
    const time = v.created_at ? format(parseISO(v.created_at), 'yyyy-MM-dd HH:mm:ss') : '';
    return `v${v.version_number}${v.tag ? ` 「${v.tag}」` : ''}${time ? ` · ${time}` : ''}`;
  };

  return (
    <div className="version-diff-view">
      <div className="version-diff-view__header">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={onClose}>
          返回编辑器
        </Button>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
          版本对比：v{versionA.version_number} vs v{versionB.version_number}
        </span>
        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
          <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
          仅显示差异
        </label>
      </div>

      <div className="version-diff-view__panels">
        <div className="version-diff-view__panel">
          <div className="version-diff-view__panel-header">{labelA(versionA)}</div>
          <div className="version-diff-view__canvas">
            <ReactFlowProvider>
              {!loading ? <DiffCanvas nodes={styledA.nodes} edges={styledA.edges} /> : null}
            </ReactFlowProvider>
          </div>
        </div>
        <div className="version-diff-view__panel">
          <div className="version-diff-view__panel-header">{labelA(versionB)}</div>
          <div className="version-diff-view__canvas">
            <ReactFlowProvider>
              {!loading ? <DiffCanvas nodes={styledB.nodes} edges={styledB.edges} /> : null}
            </ReactFlowProvider>
          </div>
        </div>
      </div>

      {diff ? (
        <div className="version-diff-view__summary">
          <span>
            变更摘要：
            <span className="version-diff-view__added">+{diff.added_nodes.length} 新增节点</span>
            {' · '}
            <span className="version-diff-view__modified">~{diff.modified_nodes.length} 修改</span>
            {' · '}
            <span className="version-diff-view__removed">-{diff.removed_nodes.length} 删除</span>
          </span>
          <span>
            连线：
            <span className="version-diff-view__added">+{diff.added_edges.length}</span>
            {' · '}
            <span className="version-diff-view__removed">-{diff.removed_edges.length}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
