import { useEffect, useMemo, useState } from 'react';
import { useExecutionStore } from '@/stores/executionStore';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { WSReviewActionMessage } from '@/types/execution';
import { NodeStatusItem } from './NodeStatusItem';

interface NodeStatusListProps {
  sendReview: (message: WSReviewActionMessage) => void;
}

export function NodeStatusList({ sendReview }: NodeStatusListProps) {
  const nodeStates = useExecutionStore((s) => s.nodeStates);
  const executionId = useExecutionStore((s) => s.executionId);
  const currentReviewNodeId = useExecutionStore((s) => s.currentReviewNodeId);
  const reviewInputData = useExecutionStore((s) => s.reviewInputData);
  const reviewDescription = useExecutionStore((s) => s.reviewDescription);
  const editorNodes = useWorkflowEditorStore((s) => s.nodes);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const orderedNodes = useMemo(() => {
    const stateList = Array.from(nodeStates.values());
    if (stateList.length === 0) return [];
    const order = new Map(editorNodes.map((n, i) => [n.id, i]));
    return [...stateList].sort((a, b) => (order.get(a.nodeId) ?? 0) - (order.get(b.nodeId) ?? 0));
  }, [editorNodes, nodeStates]);

  useEffect(() => {
    if (currentReviewNodeId) {
      setExpandedId(currentReviewNodeId);
    }
  }, [currentReviewNodeId]);

  return (
    <section className="execution-panel__section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingBottom: 0 }}>
      <div className="execution-panel__section-title">节点状态</div>
      <div className="node-status-list">
        {orderedNodes.map((node) => (
          <NodeStatusItem
            key={node.nodeId}
            node={node}
            isExpanded={expandedId === node.nodeId}
            onToggle={() =>
              setExpandedId((prev) => (prev === node.nodeId ? null : node.nodeId))
            }
            executionId={executionId}
            reviewInputData={reviewInputData}
            reviewDescription={reviewDescription}
            sendReview={sendReview}
          />
        ))}
      </div>
    </section>
  );
}
