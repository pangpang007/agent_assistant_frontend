import { format, parseISO } from 'date-fns';
import { Tag } from '@/components/ui/Tag';
import type { HistoryExecutionLog } from '@/types/phase6';
import './ExecutionTimeline.css';

export interface ExecutionTimelineProps {
  logs: HistoryExecutionLog[];
}

function levelColor(level: HistoryExecutionLog['level']): 'primary' | 'warning' | 'danger' {
  if (level === 'ERROR') return 'danger';
  if (level === 'WARN') return 'warning';
  return 'primary';
}

function dotClass(level: HistoryExecutionLog['level']): string {
  if (level === 'ERROR') return 'execution-timeline__dot--error';
  if (level === 'WARN') return 'execution-timeline__dot--warn';
  return 'execution-timeline__dot--info';
}

export function ExecutionTimeline({ logs }: ExecutionTimelineProps) {
  const items = logs ?? [];

  if (items.length === 0) {
    return <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>暂无日志</p>;
  }

  return (
    <div className="execution-timeline">
      {items.map((log) => (
        <div key={log.id} className="execution-timeline__item">
          <span className={`execution-timeline__dot ${dotClass(log.level)}`} />
          <div className="execution-timeline__content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="execution-timeline__time">
                {format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
              </span>
              <Tag color={levelColor(log.level)}>{log.level}</Tag>
            </div>
            <p className="execution-timeline__message">{log.message}</p>
            {log.node_name ? (
              <span className="execution-timeline__node">节点: {log.node_name}</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
