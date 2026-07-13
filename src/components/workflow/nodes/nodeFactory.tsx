import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { findNodeLibraryItem } from '@/components/workflow/nodeLibraryConfig';
import {
  BaseNodeShell,
  distributeHandles,
  type WorkflowNodeProps,
  type HandleConfig,
} from './BaseNode';
import type { NodeType } from '@/types';

interface SimpleNodeOptions {
  type: NodeType;
  icon: LucideIcon;
  getSummary: (config: Record<string, unknown>) => React.ReactNode;
  inputs?: HandleConfig[];
  outputs?: HandleConfig[] | ((config: Record<string, unknown>) => HandleConfig[]);
}

function createSimpleNode({ type, icon, getSummary, inputs, outputs }: SimpleNodeOptions) {
  const Component = memo(function WorkflowNodeComponent({ data, selected }: WorkflowNodeProps) {
    const item = findNodeLibraryItem(type);
    const color = item?.color ?? 'var(--accent-primary)';
    const resolvedOutputs =
      typeof outputs === 'function' ? outputs(data.config) : (outputs ?? [{ id: 'output' }]);

    return (
      <BaseNodeShell
        id=""
        data={data}
        selected={selected}
        icon={icon}
        color={color}
        summary={getSummary(data.config)}
        handles={{
          inputs: inputs ?? [{ id: 'input' }],
          outputs: resolvedOutputs,
        }}
      />
    );
  });
  Component.displayName = `${type}Node`;
  return Component;
}

function branchOutputs(
  config: Record<string, unknown>,
  key: 'branches' | 'categories' = 'branches',
): HandleConfig[] {
  const items = (config[key] as { name: string }[] | string[]) ?? [];
  const names = items.map((item) => (typeof item === 'string' ? item : item.name));
  const positions = distributeHandles(names.length || 1);
  return names.map((name, index) => ({
    id: name,
    label: name,
    top: positions[index],
  }));
}

export { createSimpleNode, branchOutputs, distributeHandles };
