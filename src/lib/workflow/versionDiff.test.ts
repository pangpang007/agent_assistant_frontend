import { describe, expect, it } from 'vitest';
import { computeVersionDiff } from './versionDiff';
import type { WorkflowEdge, WorkflowNode } from '@/types';

function makeNode(
  id: string,
  label: string,
  x = 0,
  config: Record<string, unknown> = {},
): WorkflowNode {
  return {
    id,
    type: 'agent',
    position: { x, y: 0 },
    data: {
      label,
      nodeType: 'agent',
      config,
      outputs: [],
    },
  };
}

function makeEdge(id: string, source: string, target: string): WorkflowEdge {
  return { id, source, target };
}

describe('computeVersionDiff', () => {
  it('detects added, removed, and modified nodes and edges', () => {
    const nodesA = [makeNode('n1', 'Start', 0), makeNode('n2', 'Agent A', 100)];
    const edgesA = [makeEdge('e1', 'n1', 'n2')];

    const nodesB = [
      makeNode('n1', 'Start', 0),
      makeNode('n2', 'Agent B', 100, { model: 'gpt-4' }),
      makeNode('n3', 'End', 200),
    ];
    const edgesB = [makeEdge('e1', 'n1', 'n2'), makeEdge('e2', 'n2', 'n3')];

    const diff = computeVersionDiff(nodesA, edgesA, nodesB, edgesB);

    expect(diff.added_nodes).toHaveLength(1);
    expect(diff.added_nodes[0].id).toBe('n3');
    expect(diff.removed_nodes).toHaveLength(0);
    expect(diff.modified_nodes).toHaveLength(1);
    expect(diff.modified_nodes[0].id).toBe('n2');
    expect(diff.modified_nodes[0].changed_fields).toContain('label');
    expect(diff.modified_nodes[0].changed_fields).toContain('config');
    expect(diff.added_edges).toHaveLength(1);
    expect(diff.added_edges[0].id).toBe('e2');
    expect(diff.removed_edges).toHaveLength(0);
  });

  it('detects removed nodes and edges', () => {
    const nodesA = [makeNode('n1', 'A'), makeNode('n2', 'B')];
    const edgesA = [makeEdge('e1', 'n1', 'n2')];
    const nodesB = [makeNode('n1', 'A')];
    const edgesB: WorkflowEdge[] = [];

    const diff = computeVersionDiff(nodesA, edgesA, nodesB, edgesB);

    expect(diff.removed_nodes).toHaveLength(1);
    expect(diff.removed_nodes[0].id).toBe('n2');
    expect(diff.removed_edges).toHaveLength(1);
    expect(diff.removed_edges[0].id).toBe('e1');
    expect(diff.added_nodes).toHaveLength(0);
    expect(diff.added_edges).toHaveLength(0);
  });
});
