import equal from 'fast-deep-equal';
import type { WorkflowEdge, WorkflowNode } from '@/types';
import type { DiffEdge, DiffNode, ModifiedDiffNode, VersionDiff } from '@/types/phase6';

function nodeLabel(node: WorkflowNode): string {
  return node.data?.label || node.id;
}

function nodeType(node: WorkflowNode): string {
  return node.data?.nodeType || node.type || 'unknown';
}

/** Client-side version diff when backend diff API is unavailable. */
export function computeVersionDiff(
  nodesA: WorkflowNode[],
  edgesA: WorkflowEdge[],
  nodesB: WorkflowNode[],
  edgesB: WorkflowEdge[],
): VersionDiff {
  const mapA = new Map(nodesA.map((n) => [n.id, n]));
  const mapB = new Map(nodesB.map((n) => [n.id, n]));

  const added_nodes: DiffNode[] = [];
  const removed_nodes: DiffNode[] = [];
  const modified_nodes: ModifiedDiffNode[] = [];

  for (const [id, node] of mapB) {
    if (!mapA.has(id)) {
      added_nodes.push({
        id,
        type: nodeType(node),
        label: nodeLabel(node),
        position: node.position,
      });
    }
  }

  for (const [id, node] of mapA) {
    if (!mapB.has(id)) {
      removed_nodes.push({
        id,
        type: nodeType(node),
        label: nodeLabel(node),
        position: node.position,
      });
      continue;
    }
    const next = mapB.get(id)!;
    const changed_fields: string[] = [];
    if (!equal(node.position, next.position)) changed_fields.push('position');
    if (!equal(node.data?.config, next.data?.config)) changed_fields.push('config');
    if (node.data?.label !== next.data?.label) changed_fields.push('label');
    if (nodeType(node) !== nodeType(next)) changed_fields.push('type');
    if (changed_fields.length) {
      modified_nodes.push({
        id,
        type: nodeType(next),
        label: nodeLabel(next),
        changed_fields,
      });
    }
  }

  const edgeA = new Map(edgesA.map((e) => [e.id, e]));
  const edgeB = new Map(edgesB.map((e) => [e.id, e]));
  const added_edges: DiffEdge[] = [];
  const removed_edges: DiffEdge[] = [];

  for (const [id, edge] of edgeB) {
    if (!edgeA.has(id)) {
      added_edges.push({
        id,
        source: edge.source,
        target: edge.target,
        label: typeof edge.label === 'string' ? edge.label : undefined,
      });
    }
  }
  for (const [id, edge] of edgeA) {
    if (!edgeB.has(id)) {
      removed_edges.push({
        id,
        source: edge.source,
        target: edge.target,
        label: typeof edge.label === 'string' ? edge.label : undefined,
      });
    }
  }

  return { added_nodes, removed_nodes, modified_nodes, added_edges, removed_edges };
}

export function parseGraphJson(nodesJson?: string, edgesJson?: string): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} {
  try {
    return {
      nodes: nodesJson ? (JSON.parse(nodesJson) as WorkflowNode[]) : [],
      edges: edgesJson ? (JSON.parse(edgesJson) as WorkflowEdge[]) : [],
    };
  } catch {
    return { nodes: [], edges: [] };
  }
}
