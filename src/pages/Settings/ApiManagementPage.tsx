import { useQuery } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { apiService } from '@/services/apiService';
import { ApiTableRow } from './ApiTableRow';
import '@/pages/pages.css';
import './ApiManagementPage.css';

function TableSkeleton() {
  return (
    <div className="api-table-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={48} variant="rectangular" />
      ))}
    </div>
  );
}

export default function ApiManagementPage() {
  const { data: apis, isLoading, refetch } = useQuery({
    queryKey: ['published-apis'],
    queryFn: () => apiService.listPublished(),
    staleTime: 60_000,
  });

  return (
    <div className="settings-page api-management-page">
      <header className="settings-page__header">
        <div>
          <h1 className="settings-page__title">API 管理</h1>
          <p className="settings-page__desc">管理已发布的工作流 API</p>
        </div>
      </header>

      {isLoading ? (
        <TableSkeleton />
      ) : !apis?.length ? (
        <EmptyState
          icon={<Globe size={64} strokeWidth={1.5} />}
          title="还没有发布任何 API"
          description="在工作流编辑器中点击「发布为 API」开始"
        />
      ) : (
        <div className="api-table-wrapper">
          <table className="api-table">
            <thead>
              <tr>
                <th>工作流</th>
                <th>Endpoint</th>
                <th>API Key</th>
                <th>调用次数</th>
                <th>成功率</th>
                <th>平均耗时</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {apis.map((api) => (
                <ApiTableRow key={api.id} api={api} onRefresh={() => void refetch()} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
