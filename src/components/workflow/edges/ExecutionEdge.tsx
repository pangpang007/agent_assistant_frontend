import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { useExecutionStore } from '@/stores/executionStore';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { NodeExecutionStatus } from '@/types';

type EdgeVisualState = 'idle' | 'active' | 'flowing';

function resolveEdgeState(
  sourceStatus: NodeExecutionStatus | undefined,
  targetStatus: NodeExecutionStatus | undefined,
): EdgeVisualState {
  if (sourceStatus === 'success' && targetStatus === 'running') return 'flowing';
  if (
    sourceStatus === 'success' &&
    (targetStatus === 'success' || targetStatus === 'skipped')
  ) {
    return 'active';
  }
  return 'idle';
}

export function ExecutionEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const sourceNode = useWorkflowEditorStore((s) => s.nodes.find((n) => n.id === source));
  const targetNode = useWorkflowEditorStore((s) => s.nodes.find((n) => n.id === target));
  const sourceStoreStatus = useExecutionStore((s) => s.nodeStates.get(source)?.status);
  const targetStoreStatus = useExecutionStore((s) => s.nodeStates.get(target)?.status);

  const sourceStatus = (sourceStoreStatus ?? sourceNode?.data.executionStatus) as
    | NodeExecutionStatus
    | undefined;
  const targetStatus = (targetStoreStatus ?? targetNode?.data.executionStatus) as
    | NodeExecutionStatus
    | undefined;

  const visual = resolveEdgeState(sourceStatus, targetStatus);
  const className =
    visual === 'flowing'
      ? 'exec-edge-flowing'
      : visual === 'active'
        ? 'exec-edge-active'
        : 'exec-edge-idle';

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      className={className}
      style={style}
    />
  );
}

export const executionEdgeTypes = {
  execution: ExecutionEdge,
};
