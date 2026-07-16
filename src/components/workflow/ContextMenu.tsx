import { createPortal } from 'react-dom';
import { Copy, Eye, Play, Trash2 } from 'lucide-react';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';

export function ContextMenu() {
  const contextMenu = useWorkflowEditorStore((s) => s.contextMenu);
  const closeContextMenu = useWorkflowEditorStore((s) => s.closeContextMenu);
  const duplicateNode = useWorkflowEditorStore((s) => s.duplicateNode);
  const removeNode = useWorkflowEditorStore((s) => s.removeNode);
  const removeEdge = useWorkflowEditorStore((s) => s.removeEdge);
  const pushHistory = useWorkflowEditorStore((s) => s.pushHistory);
  const setRightPanel = useWorkflowEditorStore((s) => s.setRightPanel);
  const nodes = useWorkflowEditorStore((s) => s.nodes);

  if (!contextMenu.open) return null;

  const targetNode = nodes.find((n) => n.id === contextMenu.targetNodeId);
  const isStart = targetNode?.type === 'start';
  const hasEdge = Boolean(contextMenu.targetEdgeId);
  const hasNode = Boolean(contextMenu.targetNodeId);

  const handleAction = (action: string) => {
    const nodeId = contextMenu.targetNodeId;
    const edgeId = contextMenu.targetEdgeId;
    closeContextMenu();

    switch (action) {
      case 'copy':
        if (!nodeId) return;
        duplicateNode(nodeId);
        pushHistory();
        break;
      case 'deleteNode':
        if (!nodeId || isStart) return;
        removeNode(nodeId);
        pushHistory();
        break;
      case 'deleteEdge':
        if (!edgeId) return;
        removeEdge(edgeId);
        pushHistory();
        break;
      case 'test':
        if (!nodeId) return;
        useWorkflowEditorStore.getState().selectNode(nodeId);
        setRightPanel('debug');
        break;
      case 'viewOutput':
        setRightPanel('debug');
        break;
      default:
        break;
    }
  };

  return createPortal(
    <div
      className="workflow-context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      role="menu"
    >
      {hasEdge ? (
        <button
          type="button"
          className="workflow-context-menu__item workflow-context-menu__item--danger"
          onClick={() => handleAction('deleteEdge')}
        >
          <Trash2 size={14} /> 删除连线
        </button>
      ) : null}

      {hasNode ? (
        <>
          <button type="button" className="workflow-context-menu__item" onClick={() => handleAction('copy')}>
            <Copy size={14} /> 复制节点
          </button>
          {!isStart ? (
            <button
              type="button"
              className="workflow-context-menu__item workflow-context-menu__item--danger"
              onClick={() => handleAction('deleteNode')}
            >
              <Trash2 size={14} /> 删除节点
            </button>
          ) : null}
          <div className="workflow-context-menu__divider" />
          <button type="button" className="workflow-context-menu__item" onClick={() => handleAction('test')}>
            <Play size={14} /> 测试此节点
          </button>
          <button type="button" className="workflow-context-menu__item" onClick={() => handleAction('viewOutput')}>
            <Eye size={14} /> 查看输出
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
