import { useNavigate } from 'react-router-dom';
import { Clock, GitBranch } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { formatRelativeTime } from '@/lib/knowledgeUtils';
import { dashboardService } from '@/services/dashboardService';

const STALE_TIME = 60_000;

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="dashboard-card__list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="dashboard-list-item dashboard-list-item--skeleton">
          <Skeleton variant="circular" width={32} height={32} />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" />
            <Skeleton width="40%" className="dashboard-list-item__skeleton-meta" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentWorkflows() {
  const navigate = useNavigate();
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['recent-workflows'],
    queryFn: () => dashboardService.getRecentWorkflows(5),
    staleTime: STALE_TIME,
  });

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h3 className="dashboard-panel__title">最近工作流</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/workflows')}>
          更多 →
        </Button>
      </div>

      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : !workflows?.length ? (
        <EmptyState
          icon={<GitBranch size={48} strokeWidth={1.5} />}
          title="还没有工作流"
          description="创建一个开始编排"
          action={{ label: '新建工作流', onClick: () => navigate('/workflows/new') }}
        />
      ) : (
        <div className="dashboard-panel__list">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="dashboard-list-item"
              onClick={() => navigate(`/workflows/${wf.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/workflows/${wf.id}`);
              }}
              role="button"
              tabIndex={0}
            >
              <div className="dashboard-list-item__icon">
                <GitBranch size={16} strokeWidth={1.5} />
              </div>
              <div className="dashboard-list-item__content">
                <span className="dashboard-list-item__title">{wf.name}</span>
                <span className="dashboard-list-item__meta">
                  v{wf.current_version} · {wf.node_count} 节点
                </span>
              </div>
              <div className="dashboard-list-item__time">
                <Clock size={12} strokeWidth={1.5} />
                {formatRelativeTime(wf.updated_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
