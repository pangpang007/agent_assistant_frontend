import { useCallback, useMemo, useRef } from 'react';
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
import { executionEdgeTypes } from '@/components/workflow/edges/ExecutionEdge';
import { isExecutionActive, useExecutionStore } from '@/stores/executionStore';
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

const executionDefaultEdgeOptions = {
  type: 'execution' as const,
  animated: false,
  style: {
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

  const executionStatus = useExecutionStore((s) => s.status);
  const executing = isExecutionActive(executionStatus);

  const flowEdges = useMemo(
    () =>
      executing
        ? edges.map((edge) => ({
            ...edge,
            type: 'execution',
          }))
        : edges,
    [edges, executing],
  );

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      if (executing) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    [executing],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (executing) return;
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
    [addNodeByType, executing, pushHistory, screenToFlowPosition],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      closeContextMenu();
      selectNode(node.id);
      if (!executing) {
        setRightPanel('properties');
      }
    },
    [closeContextMenu, executing, selectNode, setRightPanel],
  );

  const onPaneClick = useCallback(() => {
    closeContextMenu();
    selectNode(null);
    selectEdge(null);
  }, [closeContextMenu, selectEdge, selectNode]);

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      if (executing) return;
      event.preventDefault();
      openContextMenu(event.clientX, event.clientY, node.id, null);
    },
    [executing, openContextMenu],
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: { id: string }) => {
      if (executing) return;
      selectEdge(edge.id);
    },
    [executing, selectEdge],
  );

  return (
    <div className="workflow-canvas" ref={reactFlowWrapper}>
      {nodes.length === 0 ? (
        <div className="workflow-canvas__empty">从左侧拖入节点开始编排</div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        onNodesChange={executing ? undefined : onNodesChange}
        onEdgesChange={executing ? undefined : onEdgesChange}
        onConnect={
          executing
            ? undefined
            : (connection) => {
                if (connection.source === connection.target) return;
                onConnect(connection);
                pushHistory();
              }
        }
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeClick={onEdgeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={executionEdgeTypes}
        defaultEdgeOptions={executing ? executionDefaultEdgeOptions : defaultEdgeOptions}
        nodesDraggable={!executing}
        nodesConnectable={!executing}
        elementsSelectable={!executing}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={executing ? null : 'Delete'}
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
