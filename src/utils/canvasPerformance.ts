import type { ReactFlowProps } from '@xyflow/react';

/** Shared React Flow performance defaults for large canvases. */
export const canvasPerformanceProps: Partial<ReactFlowProps> = {
  onlyRenderVisibleElements: true,
  minZoom: 0.1,
  maxZoom: 2,
  elevateNodesOnSelect: false,
  proOptions: { hideAttribution: true },
};

export function getCanvasReadonlyProps(interactive = false): Partial<ReactFlowProps> {
  return {
    ...canvasPerformanceProps,
    nodesDraggable: false,
    nodesConnectable: false,
    elementsSelectable: interactive,
    panOnDrag: true,
    zoomOnScroll: true,
    deleteKeyCode: null,
  };
}
