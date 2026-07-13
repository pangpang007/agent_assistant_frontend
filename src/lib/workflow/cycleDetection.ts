import type { WorkflowEdge, WorkflowNode } from '@/types';

export function detectCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] | null {
  const adjacency = new Map<string, string[]>();
  nodes.forEach((n) => adjacency.set(n.id, []));
  edges.forEach((e) => {
    const list = adjacency.get(e.source);
    if (list) list.push(e.target);
  });

  const visited = new Set<string>();
  const stack = new Set<string>();
  const cycleNodes: string[] = [];

  function dfs(nodeId: string): boolean {
    if (stack.has(nodeId)) {
      cycleNodes.push(nodeId);
      return true;
    }
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    stack.add(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const next of neighbors) {
      if (dfs(next)) {
        cycleNodes.push(nodeId);
        return true;
      }
    }

    stack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && dfs(node.id)) {
      return [...new Set(cycleNodes)];
    }
  }

  return null;
}
