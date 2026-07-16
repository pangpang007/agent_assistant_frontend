import { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  Connection,
  ConnectionLineComponentProps,
  FinalConnectionState,
  Node,
  NodeMouseHandler,
} from '@xyflow/react';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  ConnectionMode,
  Controls,
  getBezierPath,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStoreApi,
  useUpdateNodeInternals,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { executionEdgeTypes } from '@/components/workflow/edges/ExecutionEdge';
import { useToast } from '@/components/ui/Toast';
import {
  buildNodeHandles,
  ensureNodeHandles,
  normalizeEdges,
  resolveConnectionHandles,
} from '@/lib/workflow/edgeHandles';
import { getNodeGroupColor } from '@/lib/workflow/nodeDefaults';
import { useExecutionStore } from '@/stores/executionStore';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import { canvasPerformanceProps } from '@/utils/canvasPerformance';
import { WorkflowEdgesOverlay } from './WorkflowEdgesOverlay';
import { nodeTypes } from './nodes';
import type { NodeType, WorkflowEdge, WorkflowNode } from '@/types';

const EDGE_STYLE = {
  stroke: 'var(--border-default)',
  strokeWidth: 2,
} as const;

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  animated: false,
  style: EDGE_STYLE,
};

const executionDefaultEdgeOptions = {
  type: 'execution' as const,
  animated: false,
  style: EDGE_STYLE,
};

/** Dragging preview line (matches accent while connecting). */
function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps) {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  return (
    <BaseEdge path={path} style={{ stroke: 'var(--accent-primary)', strokeWidth: 2 }} />
  );
}

function buildEdge(connection: Connection, nodes: WorkflowNode[]): WorkflowEdge {
  const { sourceHandle, targetHandle } = resolveConnectionHandles(connection, nodes);
  return {
    id: `edge_${connection.source}_${connection.target}_${Date.now()}`,
    source: connection.source!,
    target: connection.target!,
    sourceHandle,
    targetHandle,
    type: 'smoothstep',
    style: { ...EDGE_STYLE },
  };
}

function findNodeAtFlowPoint(
  nodes: WorkflowNode[],
  point: { x: number; y: number },
  padding = 48,
): WorkflowNode | undefined {
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    const width = node.measured?.width ?? node.width ?? 240;
    const height = node.measured?.height ?? node.height ?? 90;
    const { x, y } = node.position;
    if (
      point.x >= x - padding &&
      point.x <= x + width + padding &&
      point.y >= y - padding &&
      point.y <= y + height + padding
    ) {
      return node;
    }
  }
  return undefined;
}

function boundsOk(
  list: { id?: string | null }[] | null | undefined,
): list is { id?: string | null }[] {
  return Array.isArray(list) && list.length > 0;
}

/**
 * RF may measure handleBounds before <Handle> mounts, writing `{ source: null, target: null }`.
 * That truthy object blocks fallback to node.handles → edges never paint.
 * This overwrites empty/null bounds with declarative ports.
 */
function patchBrokenHandleBounds(
  nodeLookup: Map<string, Node>,
  nodes: WorkflowNode[],
): boolean {
  let patched = false;
  for (const userNode of nodes) {
    const internal = nodeLookup.get(userNode.id) as
      | (Node & {
          internals?: {
            handleBounds?: {
              source?: { id?: string | null }[] | null;
              target?: { id?: string | null }[] | null;
            };
            positionAbsolute?: { x: number; y: number };
            z?: number;
            userNode?: unknown;
          };
        })
      | undefined;
    if (!internal?.internals) continue;

    const handles =
      userNode.handles ??
      buildNodeHandles(userNode.type as NodeType, userNode.data.config);
    const source = handles
      .filter((h) => h.type === 'source')
      .map((h) => ({
        ...h,
        id: h.id ?? null,
        nodeId: userNode.id,
        width: h.width ?? 14,
        height: h.height ?? 14,
      }));
    const target = handles
      .filter((h) => h.type === 'target')
      .map((h) => ({
        ...h,
        id: h.id ?? null,
        nodeId: userNode.id,
        width: h.width ?? 14,
        height: h.height ?? 14,
      }));

    const hb = internal.internals.handleBounds;
    const sourceOk = boundsOk(hb?.source);
    const targetOk = boundsOk(hb?.target);
    const needsSource = source.length > 0;
    const needsTarget = target.length > 0;

    if ((!needsSource || sourceOk) && (!needsTarget || targetOk)) continue;

    nodeLookup.set(userNode.id, {
      ...internal,
      internals: {
        ...internal.internals,
        handleBounds: {
          source: sourceOk ? hb!.source! : source,
          target: targetOk ? hb!.target! : target,
        },
      },
    } as Node);
    patched = true;
  }
  return patched;
}

function CanvasInner() {
  const { screenToFlowPosition, fitView, getNodes } = useReactFlow();
  const storeApi = useStoreApi();
  const updateNodeInternals = useUpdateNodeInternals();
  const { success, error: toastError } = useToast();

  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const onNodesChange = useWorkflowEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowEditorStore((s) => s.onEdgesChange);
  const selectNode = useWorkflowEditorStore((s) => s.selectNode);
  const selectEdge = useWorkflowEditorStore((s) => s.selectEdge);
  const setRightPanel = useWorkflowEditorStore((s) => s.setRightPanel);
  const addNodeByType = useWorkflowEditorStore((s) => s.addNodeByType);
  const pushHistory = useWorkflowEditorStore((s) => s.pushHistory);
  const openContextMenu = useWorkflowEditorStore((s) => s.openContextMenu);
  const closeContextMenu = useWorkflowEditorStore((s) => s.closeContextMenu);

  const executionStatus = useExecutionStore((s) => s.status);
  const executing = executionStatus === 'running' || executionStatus === 'waiting_review';

  const connectingFromRef = useRef<{
    nodeId: string;
    handleId: string | null;
    handleType: 'source' | 'target';
  } | null>(null);

  const repairAndRefreshEdges = useCallback(
    (edgeIds?: string[]) => {
      const { nodeLookup } = storeApi.getState();
      const currentNodes = useWorkflowEditorStore.getState().nodes;
      const patched = patchBrokenHandleBounds(nodeLookup as Map<string, Node>, currentNodes);

      if (patched || edgeIds?.length) {
        useWorkflowEditorStore.setState({
          edges: useWorkflowEditorStore.getState().edges.map((e) =>
            !edgeIds || edgeIds.includes(e.id) ? { ...e } : e,
          ),
        });
      }
    },
    [storeApi],
  );

  // Repair nodes missing declarative handles + edges missing handle ids (no RF remasure here)
  useEffect(() => {
    const store = useWorkflowEditorStore.getState();
    const nextNodes = ensureNodeHandles(store.nodes);
    const nextEdges = normalizeEdges(nextNodes, store.edges);
    if (nextNodes !== store.nodes || nextEdges !== store.edges) {
      useWorkflowEditorStore.setState({ nodes: nextNodes, edges: nextEdges });
    }
  }, [nodes, edges]);

  // After node count changes, remasure then patch empty handleBounds once
  useEffect(() => {
    if (nodes.length === 0) return;
    const timer = window.setTimeout(() => {
      nodes.forEach((n) => updateNodeInternals(n.id));
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => repairAndRefreshEdges());
      });
    }, 80);
    return () => window.clearTimeout(timer);
    // Only when topology changes — avoid remasure loops on edge clones
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  const commitConnection = useCallback(
    (connection: Connection) => {
      if (executing) return false;
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;

      const store = useWorkflowEditorStore.getState();
      const nextEdge = buildEdge(connection, store.nodes);

      const exists = store.edges.some(
        (e) =>
          e.source === nextEdge.source &&
          e.target === nextEdge.target &&
          (e.sourceHandle ?? null) === (nextEdge.sourceHandle ?? null) &&
          (e.targetHandle ?? null) === (nextEdge.targetHandle ?? null),
      );
      if (exists) return false;

      useWorkflowEditorStore.setState({
        edges: [...store.edges, nextEdge],
        isDirty: true,
      });
      pushHistory();

      updateNodeInternals([connection.source, connection.target]);
      window.requestAnimationFrame(() => {
        repairAndRefreshEdges([nextEdge.id]);
        window.requestAnimationFrame(() => repairAndRefreshEdges([nextEdge.id]));
      });

      success('节点已连接');
      return true;
    },
    [executing, pushHistory, repairAndRefreshEdges, success, updateNodeInternals],
  );

  const handleConnectStart = useCallback(
    (
      _event: MouseEvent | TouchEvent,
      params: { nodeId: string | null; handleId: string | null; handleType: 'source' | 'target' | null },
    ) => {
      if (!params.nodeId || !params.handleType) {
        connectingFromRef.current = null;
        return;
      }
      connectingFromRef.current = {
        nodeId: params.nodeId,
        handleId: params.handleId,
        handleType: params.handleType,
      };
    },
    [],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      commitConnection(connection);
    },
    [commitConnection],
  );

  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      const from = connectingFromRef.current;
      connectingFromRef.current = null;
      if (executing) return;
      if (state.isValid) return;

      const fromNodeId = from?.nodeId ?? state.fromNode?.id;
      const fromHandleType = from?.handleType ?? state.fromHandle?.type;
      const fromHandleId = from?.handleId ?? state.fromHandle?.id ?? null;
      if (!fromNodeId || !fromHandleType) return;

      const clientX = 'changedTouches' in event ? event.changedTouches[0]?.clientX : event.clientX;
      const clientY = 'changedTouches' in event ? event.changedTouches[0]?.clientY : event.clientY;
      if (clientX == null || clientY == null) return;

      const flowPoint = screenToFlowPosition({ x: clientX, y: clientY });
      const measuredNodes = getNodes() as WorkflowNode[];
      const hit =
        findNodeAtFlowPoint(measuredNodes, flowPoint) ??
        findNodeAtFlowPoint(useWorkflowEditorStore.getState().nodes, flowPoint);
      if (!hit || hit.id === fromNodeId) return;

      if (fromHandleType === 'source') {
        commitConnection({
          source: fromNodeId,
          target: hit.id,
          sourceHandle: fromHandleId,
          targetHandle: null,
        });
      } else {
        commitConnection({
          source: hit.id,
          target: fromNodeId,
          sourceHandle: null,
          targetHandle: fromHandleId,
        });
      }
    },
    [commitConnection, executing, getNodes, screenToFlowPosition],
  );

  const flowEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        // Keep edges in RF store for connect/delete, but never paint via EdgeWrapper —
        // it silently skips when handleBounds race leaves null ports.
        hidden: true,
        type: executing
          ? ('execution' as const)
          : edge.type === 'execution'
            ? 'smoothstep'
            : (edge.type ?? 'smoothstep'),
        style: { ...EDGE_STYLE, ...(edge.style as object) },
      })),
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
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNodeByType(nodeType, position);
      pushHistory();
    },
    [addNodeByType, executing, pushHistory, screenToFlowPosition],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      closeContextMenu();
      selectNode(node.id);
      if (!executing) setRightPanel('properties');
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
    <div className="workflow-canvas">
      {nodes.length === 0 ? (
        <div className="workflow-canvas__empty">从左侧拖入节点开始编排</div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        {...canvasPerformanceProps}
        onNodesChange={executing ? undefined : onNodesChange}
        onEdgesChange={executing ? undefined : onEdgesChange}
        onConnectStart={handleConnectStart}
        onConnect={handleConnect}
        onConnectEnd={handleConnectEnd}
        connectionLineComponent={ConnectionLine}
        connectionMode={ConnectionMode.Strict}
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
        connectionRadius={80}
        connectOnClick={!executing}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        deleteKeyCode={executing ? null : ['Delete', 'Backspace']}
        multiSelectionKeyCode="Shift"
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        selectionKeyCode="Shift"
        onError={(_code, message) => {
          if (typeof message === 'string' && message.toLowerCase().includes('handle')) {
            toastError(`连线渲染失败：${message}`);
          }
        }}
        onInit={() => {
          window.setTimeout(() => {
            // Remasure after fitView settles — measuring during/before zoom
            // wrote inflated handleBounds (zoom race) and broke restored edges.
            void fitView({ padding: 0.2 }).then(() => {
              useWorkflowEditorStore.getState().nodes.forEach((n) => updateNodeInternals(n.id));
              window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => repairAndRefreshEdges());
              });
            });
          }, 150);
        }}
      >
        <WorkflowEdgesOverlay executing={executing} />
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
