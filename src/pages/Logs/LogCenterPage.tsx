import { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Table, type Column } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useDebounce } from '@/hooks/useDebounce';
import { useLogStore } from '@/stores/logStore';
import type { CenterLogEntry, CenterLogLevel } from '@/types/phase6';
import { LogDetailDrawer } from './LogDetailDrawer';
import '@/styles/phase2.css';
import '@/styles/phase6.css';

function levelColor(level: CenterLogLevel): 'primary' | 'warning' | 'danger' {
  if (level === 'ERROR') return 'danger';
  if (level === 'WARN') return 'warning';
  return 'primary';
}

export default function LogCenterPage() {
  const logs = useLogStore((s) => s.logs);
  const total = useLogStore((s) => s.total);
  const page = useLogStore((s) => s.page);
  const pageSize = useLogStore((s) => s.pageSize);
  const loading = useLogStore((s) => s.loading);
  const filters = useLogStore((s) => s.filters);
  const selected = useLogStore((s) => s.selected);
  const setFilter = useLogStore((s) => s.setFilter);
  const setPage = useLogStore((s) => s.setPage);
  const selectLog = useLogStore((s) => s.selectLog);
  const fetchLogs = useLogStore((s) => s.fetchLogs);

  const debouncedKeyword = useDebounce(filters.keyword ?? '');

  useEffect(() => {
    setFilter({ keyword: debouncedKeyword || undefined });
  }, [debouncedKeyword, setFilter]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs, page, filters.level, filters.keyword]);

  const columns: Column<CenterLogEntry>[] = [
    {
      key: 'timestamp',
      title: '时间',
      dataIndex: 'timestamp',
      width: 180,
      render: (v) => (
        <span className="phase6-mono">{format(parseISO(String(v)), 'yyyy-MM-dd HH:mm:ss')}</span>
      ),
    },
    {
      key: 'level',
      title: '级别',
      dataIndex: 'level',
      width: 90,
      render: (v) => <Tag color={levelColor(v as CenterLogLevel)}>{String(v)}</Tag>,
    },
    {
      key: 'workflow_name',
      title: '工作流',
      dataIndex: 'workflow_name',
    },
    {
      key: 'node_name',
      title: '节点',
      dataIndex: 'node_name',
      render: (v) => (v ? String(v) : '—'),
    },
    {
      key: 'message',
      title: '消息',
      dataIndex: 'message',
      render: (v) => (
        <span style={{ display: 'block', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {String(v)}
        </span>
      ),
    },
  ];

  return (
    <div className="phase2-page phase6-page--wide">
      <div className="phase2-header">
        <div>
          <h1 className="phase2-header__title">日志中心</h1>
          <p className="phase2-header__desc">全局执行日志汇总与检索</p>
        </div>
      </div>

      <div className="phase2-toolbar">
        <div className="phase2-toolbar__search">
          <Input
            size="md"
            fullWidth
            leftIcon={<Search size={16} />}
            placeholder="搜索日志消息..."
            value={filters.keyword ?? ''}
            onChange={(e) => setFilter({ keyword: e.target.value })}
          />
        </div>
        <select
          className="phase2-select"
          value={filters.level ?? ''}
          onChange={(e) =>
            setFilter({ level: (e.target.value as CenterLogLevel) || undefined })
          }
        >
          <option value="">全部级别</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>

      <Table
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={logs as unknown as Record<string, unknown>[]}
        rowKey="id"
        loading={loading}
        emptyText="暂无日志"
        onRowClick={(record) => selectLog(record as unknown as CenterLogEntry)}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p) => setPage(p),
        }}
      />

      <LogDetailDrawer
        open={Boolean(selected)}
        onClose={() => selectLog(null)}
        log={selected}
      />
    </div>
  );
}
