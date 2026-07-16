import { memo, useEffect } from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';
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
  const Component = memo(function WorkflowNodeComponent({
    id,
    data,
    selected,
    isConnectable,
  }: WorkflowNodeProps) {
    const updateNodeInternals = useUpdateNodeInternals();
    const item = findNodeLibraryItem(type);
    const color = item?.color ?? 'var(--accent-primary)';
    const resolvedOutputs =
      typeof outputs === 'function' ? outputs(data.config) : (outputs ?? [{ id: 'output' }]);
    const resolvedInputs = inputs ?? [{ id: 'input' }];
    const handleSignature = [
      ...resolvedInputs.map((h) => h.id),
      ...resolvedOutputs.map((h) => `${h.id}:${h.top ?? ''}`),
    ].join('|');

    useEffect(() => {
      // Wait until Handles are in the DOM — early measure writes `{source:null,target:null}`
      // which blocks RF from using declarative node.handles.
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => updateNodeInternals(id));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }, [id, handleSignature, updateNodeInternals]);

    return (
      <BaseNodeShell
        id={id}
        data={data}
        selected={selected}
        isConnectable={isConnectable}
        icon={icon}
        color={color}
        summary={getSummary(data.config)}
        handles={{
          inputs: resolvedInputs,
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
  if (names.length === 0) {
    return [{ id: 'default', label: '默认', top: '50%' }];
  }
  const positions = distributeHandles(names.length);
  return names.map((name, index) => ({
    id: name || `branch_${index}`,
    label: name || `分支 ${index + 1}`,
    top: positions[index],
  }));
}

export { createSimpleNode, branchOutputs, distributeHandles };
