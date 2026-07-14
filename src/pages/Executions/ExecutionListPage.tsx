import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Table, type Column } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCost, formatTokenCount } from '@/lib/validation';
import { handleApiError } from '@/utils/apiErrorHandler';
import type { HistoryExecution } from '@/types/phase6';
import { ExecutionStatusBadge } from './ExecutionStatusBadge';
import { useExecutionListStore } from './store';
import '@/styles/phase2.css';
import '@/styles/phase6.css';

export default function ExecutionListPage() {
  const navigate = useNavigate();
  const items = useExecutionListStore((s) => s.items);
  const total = useExecutionListStore((s) => s.total);
  const page = useExecutionListStore((s) => s.page);
  const pageSize = useExecutionListStore((s) => s.pageSize);
  const loading = useExecutionListStore((s) => s.loading);
  const keyword = useExecutionListStore((s) => s.keyword);
  const statusFilter = useExecutionListStore((s) => s.statusFilter);
  const fetch = useExecutionListStore((s) => s.fetch);
  const setPage = useExecutionListStore((s) => s.setPage);
  const setKeyword = useExecutionListStore((s) => s.setKeyword);
  const setStatusFilter = useExecutionListStore((s) => s.setStatusFilter);

  const [searchInput, setSearchInput] = useState(keyword);
  const debouncedKeyword = useDebounce(searchInput);

  useEffect(() => {
    if (debouncedKeyword !== keyword) {
      setKeyword(debouncedKeyword);
    }
  }, [debouncedKeyword, keyword, setKeyword]);

  useEffect(() => {
    void fetch().catch((error) => handleApiError(error, '加载执行历史'));
  }, [fetch]);

  const hasRunning = items.some((i) => i.status === 'running');
  useEffect(() => {
    if (!hasRunning) return;
    const timer = setInterval(() => {
      void fetch().catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [hasRunning, fetch]);

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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="phase2-select"
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
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
        data={items as unknown as Record<string, unknown>[]}
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
