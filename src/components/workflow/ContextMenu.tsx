import { createPortal } from 'react-dom';
import { Copy, Eye, Play, Trash2 } from 'lucide-react';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';

export function ContextMenu() {
  const contextMenu = useWorkflowEditorStore((s) => s.contextMenu);
  const closeContextMenu = useWorkflowEditorStore((s) => s.closeContextMenu);
  const duplicateNode = useWorkflowEditorStore((s) => s.duplicateNode);
  const removeNode = useWorkflowEditorStore((s) => s.removeNode);
  const pushHistory = useWorkflowEditorStore((s) => s.pushHistory);
  const setRightPanel = useWorkflowEditorStore((s) => s.setRightPanel);
  const nodes = useWorkflowEditorStore((s) => s.nodes);

  if (!contextMenu.open) return null;

  const targetNode = nodes.find((n) => n.id === contextMenu.targetNodeId);
  const isStart = targetNode?.type === 'start';

  const handleAction = (action: string) => {
    const nodeId = contextMenu.targetNodeId;
    closeContextMenu();
    if (!nodeId) return;

    switch (action) {
      case 'copy':
        duplicateNode(nodeId);
        pushHistory();
        break;
      case 'delete':
        if (!isStart) {
          removeNode(nodeId);
          pushHistory();
        }
        break;
      case 'test':
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
      {contextMenu.targetNodeId ? (
        <>
          <button type="button" className="workflow-context-menu__item" onClick={() => handleAction('copy')}>
            <Copy size={14} /> 复制节点
          </button>
          {!isStart ? (
            <button
              type="button"
              className="workflow-context-menu__item workflow-context-menu__item--danger"
              onClick={() => handleAction('delete')}
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
