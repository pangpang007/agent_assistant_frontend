import { CheckCircle, Clock, Coins, DollarSign } from 'lucide-react';
import { useExecutionStore } from '@/stores/executionStore';
import { formatDuration } from '@/hooks/useExecutionTimer';

export function ExecutionStats() {
  const totalDuration = useExecutionStore((s) => s.totalDuration);
  const totalTokens = useExecutionStore((s) => s.totalTokens);
  const estimatedCost = useExecutionStore((s) => s.estimatedCost);
  const completedNodeCount = useExecutionStore((s) => s.completedNodeCount);
  const totalNodeCount = useExecutionStore((s) => s.totalNodeCount);

  const stats = [
    {
      icon: <Clock size={12} />,
      label: '总耗时',
      value: formatDuration(totalDuration),
    },
    {
      icon: <Coins size={12} />,
      label: '总 Token',
      value: totalTokens.total_tokens.toLocaleString(),
    },
    {
      icon: <DollarSign size={12} />,
      label: '预估费用',
      value: `$${estimatedCost.toFixed(4)}`,
    },
    {
      icon: <CheckCircle size={12} />,
      label: '完成节点',
      value: `${completedNodeCount} / ${totalNodeCount}`,
    },
  ];

  return (
    <section className="execution-panel__section">
      <div className="execution-panel__section-title">统计信息</div>
      <div className="execution-stats__grid">
        {stats.map((stat) => (
          <div key={stat.label} className="execution-stats__cell">
            <div className="execution-stats__label">
              {stat.icon}
              {stat.label}
            </div>
            <div className="execution-stats__value">{stat.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
