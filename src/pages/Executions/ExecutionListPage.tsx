import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Table, type Column } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCost, formatTokenCount } from '@/lib/validation';
import { useExecutionHistoryStore } from '@/stores/executionHistoryStore';
import type { HistoryExecution } from '@/types/phase6';
import { ExecutionStatusBadge } from './ExecutionStatusBadge';
import '@/styles/phase2.css';
import '@/styles/phase6.css';

export default function ExecutionListPage() {
  const navigate = useNavigate();
  const list = useExecutionHistoryStore((s) => s.list);
  const total = useExecutionHistoryStore((s) => s.total);
  const page = useExecutionHistoryStore((s) => s.page);
  const pageSize = useExecutionHistoryStore((s) => s.pageSize);
  const loading = useExecutionHistoryStore((s) => s.loading);
  const filters = useExecutionHistoryStore((s) => s.filters);
  const setFilter = useExecutionHistoryStore((s) => s.setFilter);
  const setPage = useExecutionHistoryStore((s) => s.setPage);
  const fetchList = useExecutionHistoryStore((s) => s.fetchList);

  const debouncedKeyword = useDebounce(filters.keyword ?? '');

  useEffect(() => {
    setFilter({ keyword: debouncedKeyword || undefined });
  }, [debouncedKeyword, setFilter]);

  useEffect(() => {
    void fetchList();
  }, [fetchList, page, filters.status, filters.workflow_id, filters.keyword]);

  const columns: Column<HistoryExecution>[] = [
    {
      key: 'workflow_name',
      title: '工作流',
      dataIndex: 'workflow_name',
      render: (v) => <span>{String(v)}</span>,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      render: (v) => <ExecutionStatusBadge status={v as HistoryExecution['status']} />,
    },
    {
      key: 'version',
      title: '版本',
      dataIndex: 'version_number',
      width: 80,
      render: (v) => <span>v{String(v)}</span>,
    },
    {
      key: 'trigger',
      title: '触发方式',
      dataIndex: 'trigger_type',
      width: 100,
      render: (v) => <Tag color="default">{v === 'api' ? 'API' : '手动'}</Tag>,
    },
    {
      key: 'duration',
      title: '耗时',
      dataIndex: 'total_duration_ms',
      width: 100,
      render: (v) => {
        const ms = v as number | null;
        if (ms == null) return '—';
        if (ms < 1000) return `${ms} ms`;
        return `${(ms / 1000).toFixed(1)} s`;
      },
    },
    {
      key: 'tokens',
      title: 'Tokens',
      dataIndex: 'total_tokens',
      width: 100,
      render: (v) => {
        const n = v as number | null;
        return n != null ? formatTokenCount(n) : '—';
      },
    },
    {
      key: 'cost',
      title: '费用',
      dataIndex: 'total_cost',
      width: 90,
      render: (v) => {
        const c = v as number | null;
        return c != null ? formatCost(c) : '—';
      },
    },
    {
      key: 'started_at',
      title: '开始时间',
      dataIndex: 'started_at',
      width: 180,
      render: (v) => (
        <span className="phase6-mono">{format(parseISO(String(v)), 'yyyy-MM-dd HH:mm:ss')}</span>
      ),
    },
  ];

  return (
    <div className="phase2-page phase6-page--wide">
      <div className="phase2-header">
        <div>
          <h1 className="phase2-header__title">执行历史</h1>
          <p className="phase2-header__desc">查看工作流执行记录与运行结果</p>
        </div>
      </div>

      <div className="phase2-toolbar">
        <div className="phase2-toolbar__search">
          <Input
            size="md"
            fullWidth
            leftIcon={<Search size={16} />}
            placeholder="搜索工作流名称..."
            value={filters.keyword ?? ''}
            onChange={(e) => setFilter({ keyword: e.target.value })}
          />
        </div>
        <select
          className="phase2-select"
          value={filters.status ?? ''}
          onChange={(e) => setFilter({ status: e.target.value || undefined })}
        >
          <option value="">全部状态</option>
          <option value="success">成功</option>
          <option value="failed">失败</option>
          <option value="running">运行中</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      <Table
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={list as unknown as Record<string, unknown>[]}
        rowKey="id"
        loading={loading}
        emptyText="暂无执行记录"
        onRowClick={(record) => navigate(`/executions/${String(record.id)}`)}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p) => setPage(p),
        }}
      />
    </div>
  );
}
