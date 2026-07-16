import type { ReactFlowProps } from '@xyflow/react';

/** Shared React Flow defaults (safe for interactive editor). */
export const canvasPerformanceProps: Partial<ReactFlowProps> = {
  minZoom: 0.1,
  maxZoom: 2,
  elevateNodesOnSelect: false,
  proOptions: { hideAttribution: true },
  connectionRadius: 30,
};

/** Readonly / preview canvases can virtualize offscreen nodes. */
export function getCanvasReadonlyProps(interactive = false): Partial<ReactFlowProps> {
  return {
    ...canvasPerformanceProps,
    onlyRenderVisibleElements: true,
    nodesDraggable: false,
    nodesConnectable: false,
    elementsSelectable: interactive,
    panOnDrag: true,
    zoomOnScroll: true,
    deleteKeyCode: null,
  };
}
