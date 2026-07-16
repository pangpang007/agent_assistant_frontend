import { useMemo } from 'react';
import {
  Position,
  ViewportPortal,
  getSmoothStepPath,
  useNodes,
  useStoreApi,
} from '@xyflow/react';
import { sourceHandleIds } from '@/lib/workflow/edgeHandles';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { WorkflowEdge, WorkflowNode } from '@/types';

/** Visual card width from BaseNode.css — never use measured.width (includes protruding handles). */
const CARD_W = 240;
/** .custom-handle is 10×10, centered on the card edge via RF translate(±50%, -50%). */
const HANDLE_R = 4;

function sourceYRatio(node: WorkflowNode, sourceHandle: string | null | undefined): number {
  const ids = sourceHandleIds(node);
  if (ids.length <= 1) return 0.5;
  const index = Math.max(
    0,
    ids.findIndex((id) => id === (sourceHandle ?? ids[0])),
  );
  return (index + 1) / (ids.length + 1);
}

/**
 * Anchor at the outer tip of the port (not the card edge / handle center),
 * so the path doesn't draw a stub through the middle of the circle.
 * Skip RF handleBounds — refresh-time fitView/zoom races inflate them.
 */
function endpoint(
  node: WorkflowNode,
  side: 'source' | 'target',
  handleId: string | null | undefined,
  positionAbsolute?: { x: number; y: number },
): { x: number; y: number } {
  const origin = positionAbsolute ?? node.position;
  const height = node.measured?.height ?? node.height ?? node.initialHeight ?? 88;

  if (side === 'source') {
    return {
      x: origin.x + CARD_W + HANDLE_R,
      y: origin.y + height * sourceYRatio(node, handleId),
    };
  }
  return {
    x: origin.x - HANDLE_R,
    y: origin.y + height / 2,
  };
}

/**
 * Draws edges ourselves. RF's EdgeWrapper silently skips paint when
 * handleBounds were measured too early as `{source:null,target:null}`.
 * ViewportPortal keeps paths in sync with pan/zoom.
 */
export function WorkflowEdgesOverlay({ executing }: { executing: boolean }) {
  const edges = useWorkflowEditorStore((s) => s.edges);
  const selectedEdgeId = useWorkflowEditorStore((s) => s.selectedEdgeId);
  const selectEdge = useWorkflowEditorStore((s) => s.selectEdge);
  const openContextMenu = useWorkflowEditorStore((s) => s.openContextMenu);
  const rfNodes = useNodes() as WorkflowNode[];
  const storeApi = useStoreApi();

  const nodeMap = useMemo(() => {
    const map = new Map<string, WorkflowNode>();
    rfNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [rfNodes]);

  const paths = useMemo(() => {
    const { nodeLookup } = storeApi.getState();
    return edges.reduce<{ edge: WorkflowEdge; path: string }[]>((acc, edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return acc;

      const sourceInternal = nodeLookup.get(edge.source) as
        | { internals?: { positionAbsolute?: { x: number; y: number } } }
        | undefined;
      const targetInternal = nodeLookup.get(edge.target) as
        | { internals?: { positionAbsolute?: { x: number; y: number } } }
        | undefined;

      const s = endpoint(
        source,
        'source',
        edge.sourceHandle,
        sourceInternal?.internals?.positionAbsolute,
      );
      const t = endpoint(
        target,
        'target',
        edge.targetHandle,
        targetInternal?.internals?.positionAbsolute,
      );

      const [path] = getSmoothStepPath({
        sourceX: s.x,
        sourceY: s.y,
        sourcePosition: Position.Right,
        targetX: t.x,
        targetY: t.y,
        targetPosition: Position.Left,
        borderRadius: 8,
      });
      acc.push({ edge, path });
      return acc;
    }, []);
  }, [edges, nodeMap, storeApi]);

  return (
    <ViewportPortal>
      <svg
        className="workflow-edges-overlay"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1,
          height: 1,
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {paths.map(({ edge, path }) => {
          const selected = edge.id === selectedEdgeId;
          return (
            <g key={edge.id}>
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ pointerEvents: executing ? 'none' : 'stroke', cursor: 'pointer' }}
                onClick={(event) => {
                  event.stopPropagation();
                  selectEdge(edge.id);
                }}
                onContextMenu={(event) => {
                  if (executing) return;
                  event.preventDefault();
                  event.stopPropagation();
                  selectEdge(edge.id);
                  openContextMenu(event.clientX, event.clientY, null, edge.id);
                }}
              />
              <path
                d={path}
                fill="none"
                stroke={selected ? 'var(--accent-primary)' : 'var(--border-default)'}
                strokeWidth={selected ? 2.5 : 2}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          );
        })}
      </svg>
    </ViewportPortal>
  );
}
