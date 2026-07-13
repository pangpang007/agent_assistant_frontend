import type { AvailableVariable, WorkflowEdge, WorkflowNode } from '@/types';

export function getUpstreamNodeIds(
  nodeId: string,
  edges: WorkflowEdge[],
  nodes: WorkflowNode[],
): Set<string> {
  const upstream = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    edges
      .filter((e) => e.target === current)
      .forEach((e) => {
        if (!upstream.has(e.source)) {
          upstream.add(e.source);
          queue.push(e.source);
        }
      });
  }

  // Include start node variables globally
  nodes.filter((n) => n.type === 'start').forEach((n) => upstream.add(n.id));
  return upstream;
}

export function getAvailableVariables(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): AvailableVariable[] {
  const upstreamIds = getUpstreamNodeIds(nodeId, edges, nodes);
  const variables: AvailableVariable[] = [];

  nodes
    .filter((n) => upstreamIds.has(n.id))
    .forEach((node) => {
      const startInputs =
        node.type === 'start'
          ? ((node.data.config.inputVariables as { name: string; type: string }[]) ?? [])
          : [];

      if (node.type === 'start') {
        startInputs.forEach((v) => {
          variables.push({
            nodeId: node.id,
            nodeLabel: node.data.label,
            variableName: v.name,
            variableType: v.type,
            fullRef: `${node.id}.${v.name}`,
          });
        });
      }

      node.data.outputs.forEach((output) => {
        variables.push({
          nodeId: node.id,
          nodeLabel: node.data.label,
          variableName: output.name,
          variableType: output.type,
          fullRef: `${node.id}.${output.name}`,
        });
      });
    });

  return variables;
}

const VAR_PATTERN = /\$\{([^}]+)\}/g;

export function extractVariableRefs(text: string): string[] {
  const refs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = VAR_PATTERN.exec(text)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

export function validateVariableRefs(
  text: string,
  available: AvailableVariable[],
): string[] {
  const availableSet = new Set(available.map((v) => v.fullRef));
  return extractVariableRefs(text).filter((ref) => !availableSet.has(ref));
}

export function formatVariableRef(fullRef: string): string {
  return `\${${fullRef}}`;
}
