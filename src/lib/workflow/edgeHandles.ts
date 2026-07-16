import { Position, type Connection, type NodeHandle } from '@xyflow/react';
import type { WorkflowEdge, WorkflowNode } from '@/types';

const NODE_W = 240;
const NODE_H = 88;
const HANDLE_SIZE = 14;

function coerceHandleId(id: string | null | undefined): string | undefined {
  if (id == null || id === '' || id === 'null' || id === 'undefined') return undefined;
  return id;
}

/** Default target (left) handle id for a node type. */
export function defaultTargetHandleId(node: WorkflowNode): string | null {
  switch (node.type) {
    case 'start':
      return null;
    case 'variableAggregator':
      return 'input-0';
    default:
      return 'input';
  }
}

/** Source handle ids rendered on the right of a node. */
export function sourceHandleIds(node: WorkflowNode): string[] {
  switch (node.type) {
    case 'end':
      return [];
    case 'condition':
    case 'parallel': {
      const branches = (node.data.config.branches as { name: string }[] | undefined) ?? [];
      const names = branches.map((b) => b.name).filter(Boolean);
      return names.length > 0 ? names : ['default'];
    }
    case 'questionClassifier': {
      const categories = (node.data.config.categories as string[] | undefined) ?? [];
      return categories.length > 0 ? categories : ['default'];
    }
    case 'review':
      return ['approved', 'rejected'];
    case 'test':
      return ['passed', 'failed'];
    default:
      return ['output'];
  }
}

export function defaultSourceHandleId(node: WorkflowNode): string | null {
  return sourceHandleIds(node)[0] ?? null;
}

/**
 * Declarative handle bounds so RF can paint edges before DOM measurement.
 * Coordinates match a 240×88 node with 14px ports on left/right.
 */
export function buildNodeHandles(
  type: WorkflowNode['type'],
  config: Record<string, unknown> = {},
): NodeHandle[] {
  const provisional = {
    id: '_',
    type,
    position: { x: 0, y: 0 },
    data: { label: '', nodeType: type, config, outputs: [] },
  } as WorkflowNode;

  const handles: NodeHandle[] = [];
  const targetId = defaultTargetHandleId(provisional);
  if (targetId) {
    handles.push({
      id: targetId,
      type: 'target',
      position: Position.Left,
      x: -HANDLE_SIZE / 2,
      y: NODE_H / 2 - HANDLE_SIZE / 2,
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
    });
  }

  const sourceIds = sourceHandleIds(provisional);
  const count = sourceIds.length;
  sourceIds.forEach((id, index) => {
    const topRatio = count <= 1 ? 0.5 : (index + 1) / (count + 1);
    handles.push({
      id,
      type: 'source',
      position: Position.Right,
      x: NODE_W - HANDLE_SIZE / 2,
      y: NODE_H * topRatio - HANDLE_SIZE / 2,
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
    });
  });

  return handles;
}

/**
 * Resolve source/target handle ids so RF can paint the edge.
 * Prefer the connection's own ids; fall back to node-type defaults.
 */
export function resolveConnectionHandles(
  connection: Connection,
  nodes: WorkflowNode[],
): { sourceHandle: string | undefined; targetHandle: string | undefined } {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  const sourceHandle =
    coerceHandleId(connection.sourceHandle) ??
    (sourceNode ? defaultSourceHandleId(sourceNode) : 'output') ??
    undefined;
  const targetHandle =
    coerceHandleId(connection.targetHandle) ??
    (targetNode ? defaultTargetHandleId(targetNode) : 'input') ??
    undefined;

  return { sourceHandle, targetHandle };
}

/** Repair edges saved without handle ids (invisible in React Flow). */
export function normalizeEdges(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowEdge[] {
  let changed = false;
  const next = edges.map((edge) => {
    if (edge.sourceHandle != null && edge.targetHandle != null) return edge;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    const sourceHandle =
      coerceHandleId(edge.sourceHandle) ??
      (sourceNode ? defaultSourceHandleId(sourceNode) : undefined) ??
      undefined;
    const targetHandle =
      coerceHandleId(edge.targetHandle) ??
      (targetNode ? defaultTargetHandleId(targetNode) : undefined) ??
      undefined;

    if (sourceHandle === edge.sourceHandle && targetHandle === edge.targetHandle) return edge;
    changed = true;
    return { ...edge, sourceHandle, targetHandle };
  });
  return changed ? next : edges;
}

/** Ensure every node has declarative handles for RF edge positioning. */
export function ensureNodeHandles(nodes: WorkflowNode[]): WorkflowNode[] {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.handles && node.handles.length > 0) return node;
    changed = true;
    return {
      ...node,
      handles: buildNodeHandles(node.type as WorkflowNode['type'], node.data.config),
      initialWidth: node.initialWidth ?? NODE_W,
      initialHeight: node.initialHeight ?? NODE_H,
    };
  });
  return changed ? next : nodes;
}
