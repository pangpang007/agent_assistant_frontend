import { memo } from 'react';
import type { NodeType } from '@/types';
import { NodeLibraryIcon } from './WorkflowIcons';

interface NodeLibraryItemProps {
  type: NodeType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const NodeLibraryItem = memo(function NodeLibraryItem({
  type,
  name,
  description,
  icon,
  color,
}: NodeLibraryItemProps) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow-type', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="node-library-item"
      draggable
      onDragStart={onDragStart}
      role="listitem"
    >
      <div className="node-library-item__icon" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
        <NodeLibraryIcon name={icon} color={color} />
      </div>
      <div className="node-library-item__text">
        <div className="node-library-item__name">{name}</div>
        <div className="node-library-item__desc">{description}</div>
      </div>
    </div>
  );
});
