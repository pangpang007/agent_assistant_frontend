import { memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import type { NodeExecutionStatus, WorkflowNodeData } from '@/types';
import './BaseNode.css';

export interface HandleConfig {
  id: string;
  label?: string;
  position?: Position;
  top?: string;
}

export interface BaseNodeShellProps {
  id: string;
  data: WorkflowNodeData;
  selected?: boolean;
  icon: LucideIcon;
  color: string;
  summary: ReactNode;
  handles: {
    inputs?: HandleConfig[];
    outputs?: HandleConfig[];
  };
}

function statusClass(status?: NodeExecutionStatus): string {
  switch (status) {
    case 'pending':
      return 'base-node--pending';
    case 'running':
      return 'base-node--running';
    case 'success':
      return 'base-node--success';
    case 'error':
      return 'base-node--error';
    case 'waiting_review':
      return 'base-node--waiting';
    case 'skipped':
      return 'base-node--skipped';
    default:
      return '';
  }
}

function statusDotClass(status?: NodeExecutionStatus): string | undefined {
  switch (status) {
    case 'pending':
      return 'base-node__status--pending';
    case 'running':
      return 'base-node__status--running';
    case 'success':
      return 'base-node__status--success';
    case 'error':
      return 'base-node__status--error';
    case 'waiting_review':
      return 'base-node__status--waiting';
    case 'skipped':
      return 'base-node__status--skipped';
    default:
      return undefined;
  }
}

export const BaseNodeShell = memo(function BaseNodeShell({
  data,
  selected,
  icon: Icon,
  color,
  summary,
  handles,
}: BaseNodeShellProps) {
  const status = data.executionStatus;
  const dotClass = statusDotClass(status);

  return (
    <div
      className={clsx('base-node', selected && 'base-node--selected', statusClass(status))}
    >
      <div className="base-node__accent" style={{ background: color }} />
      <div className="base-node__header">
        <Icon className="base-node__icon" style={{ color }} />
        <span className="base-node__title">{data.label}</span>
        {dotClass ? <span className={clsx('base-node__status', dotClass)} /> : null}
      </div>
      <div className="base-node__body">{summary}</div>

      {handles.inputs?.map((input) => (
        <div key={input.id}>
          <Handle
            id={input.id}
            type="target"
            position={input.position ?? Position.Left}
            className="custom-handle"
            style={{ top: input.top ?? '50%' }}
          />
          {input.label ? (
            <span
              className="custom-handle-label custom-handle-label--input"
              style={{ top: input.top ?? '50%' }}
            >
              {input.label}
            </span>
          ) : null}
        </div>
      ))}

      {handles.outputs?.map((output) => (
        <div key={output.id}>
          <Handle
            id={output.id}
            type="source"
            position={output.position ?? Position.Right}
            className="custom-handle"
            style={{ top: output.top ?? '50%' }}
          />
          {output.label ? (
            <span
              className="custom-handle-label custom-handle-label--output"
              style={{ top: output.top ?? '50%' }}
            >
              {output.label}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
});

export type WorkflowNodeProps = NodeProps & { data: WorkflowNodeData };

export function distributeHandles(count: number): string[] {
  if (count <= 1) return ['50%'];
  const positions: string[] = [];
  const step = 100 / (count + 1);
  for (let i = 1; i <= count; i += 1) {
    positions.push(`${step * i}%`);
  }
  return positions;
}
