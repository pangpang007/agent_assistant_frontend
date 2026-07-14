import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { formatDuration } from '@/hooks/useExecutionTimer';
import { formatRelativeTime } from '@/lib/knowledgeUtils';
import { dashboardService } from '@/services/dashboardService';
import { ExecutionStatusBadge } from '@/pages/Executions/ExecutionStatusBadge';

const STALE_TIME = 60_000;

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="dashboard-table-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="dashboard-table-skeleton__row">
          <Skeleton width="30%" />
          <Skeleton width="15%" />
          <Skeleton width="12%" />
          <Skeleton width="12%" />
          <Skeleton width="18%" />
        </div>
      ))}
    </div>
  );
}

export function RecentExecutions() {
  const navigate = useNavigate();
  const { data: executions, isLoading } = useQuery({
    queryKey: ['recent-executions'],
    queryFn: () => dashboardService.getRecentExecutions(5),
    staleTime: STALE_TIME,
  });

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h3 className="dashboard-panel__title">最近执行记录</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/executions')}>
          更多 →
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : !executions?.length ? (
        <EmptyState
          icon={<Clock size={48} strokeWidth={1.5} />}
          title="还没有执行记录"
          description="运行一个工作流试试"
          action={{ label: '去工作流列表', onClick: () => navigate('/workflows') }}
        />
      ) : (
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>工作流</th>
                <th>状态</th>
                <th>耗时</th>
                <th>Token</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((exec) => (
                <tr
                  key={exec.id}
                  className="dashboard-table__row"
                  onClick={() => navigate(`/executions/${exec.id}`)}
                >
                  <td className="dashboard-table__name">{exec.workflow_name}</td>
                  <td>
                    <ExecutionStatusBadge status={exec.status} />
                  </td>
                  <td>
                    {exec.total_duration_ms != null
                      ? formatDuration(exec.total_duration_ms)
                      : '-'}
                  </td>
                  <td>{exec.total_tokens?.toLocaleString() ?? '-'}</td>
                  <td className="dashboard-table__time">
                    {formatRelativeTime(exec.started_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
