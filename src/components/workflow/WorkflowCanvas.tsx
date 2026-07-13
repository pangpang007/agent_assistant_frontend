import { useCallback, useRef } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import { getNodeGroupColor } from '@/lib/workflow/nodeDefaults';
import { nodeTypes } from './nodes';
import type { NodeType, WorkflowNode } from '@/types';

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  animated: false,
  style: {
    stroke: 'var(--border-default)',
    strokeWidth: 2,
  },
};

function CanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const onNodesChange = useWorkflowEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowEditorStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowEditorStore((s) => s.onConnect);
  const selectNode = useWorkflowEditorStore((s) => s.selectNode);
  const selectEdge = useWorkflowEditorStore((s) => s.selectEdge);
  const setRightPanel = useWorkflowEditorStore((s) => s.setRightPanel);
  const addNodeByType = useWorkflowEditorStore((s) => s.addNodeByType);
  const pushHistory = useWorkflowEditorStore((s) => s.pushHistory);
  const openContextMenu = useWorkflowEditorStore((s) => s.openContextMenu);
  const closeContextMenu = useWorkflowEditorStore((s) => s.closeContextMenu);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/reactflow-type') as NodeType;
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNodeByType(nodeType, position);
      pushHistory();
    },
    [addNodeByType, pushHistory, screenToFlowPosition],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      closeContextMenu();
      selectNode(node.id);
      setRightPanel('properties');
    },
    [closeContextMenu, selectNode, setRightPanel],
  );

  const onPaneClick = useCallback(() => {
    closeContextMenu();
    selectNode(null);
    selectEdge(null);
  }, [closeContextMenu, selectEdge, selectNode]);

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      openContextMenu(event.clientX, event.clientY, node.id, null);
    },
    [openContextMenu],
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: { id: string }) => {
      selectEdge(edge.id);
    },
    [selectEdge],
  );

  return (
    <div className="workflow-canvas" ref={reactFlowWrapper}>
      {nodes.length === 0 ? (
        <div className="workflow-canvas__empty">从左侧拖入节点开始编排</div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(connection) => {
          if (connection.source === connection.target) return;
          onConnect(connection);
          pushHistory();
        }}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeClick={onEdgeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        selectionKeyCode="Shift"
        minZoom={0.1}
        maxZoom={2}
        onInit={() => {
          window.setTimeout(() => fitView({ padding: 0.2 }), 100);
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border-muted)" />
        <MiniMap
          nodeColor={(node: Node) => {
            const wfNode = node as WorkflowNode;
            return getNodeGroupColor(wfNode.data?.nodeType ?? (wfNode.type as NodeType));
          }}
          maskColor="rgba(13, 17, 23, 0.7)"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
        />
        <Controls
          showInteractive={false}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
        />
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
