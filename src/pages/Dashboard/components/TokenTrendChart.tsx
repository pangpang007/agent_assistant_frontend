import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/Spinner';
import { dashboardService } from '@/services/dashboardService';
import type { TokenTrendItem } from '@/types/phase7';

const STALE_TIME = 60_000;

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label">{label}</div>
      <div className="chart-tooltip__value">
        <span className="chart-tooltip__dot" />
        {typeof value === 'number' ? value.toLocaleString() : value} tokens
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="token-chart token-chart--loading">
      <Skeleton variant="rectangular" height={220} />
    </div>
  );
}

export function TokenTrendChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['token-trend'],
    queryFn: () => dashboardService.getTokenTrend({ days: 7 }),
    staleTime: STALE_TIME,
  });

  const chartData: TokenTrendItem[] = data?.length
    ? data
    : [
        { date: '1', label: '一', tokens: 0 },
        { date: '2', label: '二', tokens: 0 },
        { date: '3', label: '三', tokens: 0 },
        { date: '4', label: '四', tokens: 0 },
        { date: '5', label: '五', tokens: 0 },
        { date: '6', label: '六', tokens: 0 },
        { date: '7', label: '日', tokens: 0 },
      ];

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h3 className="dashboard-panel__title">Token 消耗趋势</h3>
        <span className="dashboard-panel__subtitle">近 7 天</span>
      </div>
      <div className="token-chart">
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-muted)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                tickFormatter={(value: number) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                  return String(value);
                }}
                width={40}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--border-default)', strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="var(--accent-primary)"
                strokeWidth={2}
                fill="url(#tokenGradient)"
                dot={{ r: 3, fill: 'var(--accent-primary)', strokeWidth: 0 }}
                activeDot={{
                  r: 5,
                  fill: 'var(--accent-primary)',
                  stroke: 'var(--bg-canvas)',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
