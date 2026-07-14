import { Bot, BookOpen, GitBranch, Play } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

const STALE_TIME = 60_000;

interface StatItem {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  colorClass: string;
}

export function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    staleTime: STALE_TIME,
  });

  const stats: StatItem[] = [
    {
      label: '工作流总数',
      value: data?.workflowCount ?? '-',
      icon: <GitBranch size={20} strokeWidth={1.5} />,
      colorClass: 'stat-card__icon--primary',
    },
    {
      label: 'Agent 总数',
      value: data?.agentCount ?? '-',
      icon: <Bot size={20} strokeWidth={1.5} />,
      colorClass: 'stat-card__icon--purple',
    },
    {
      label: '知识库数',
      value: data?.knowledgeBaseCount ?? '-',
      icon: <BookOpen size={20} strokeWidth={1.5} />,
      colorClass: 'stat-card__icon--success',
    },
    {
      label: '本月执行',
      value: data?.monthlyExecutions ?? '-',
      subValue: data ? `${data.successRate}% 成功率` : undefined,
      icon: <Play size={20} strokeWidth={1.5} />,
      colorClass: 'stat-card__icon--warning',
    },
  ];

  if (isLoading) {
    return (
      <div className="stats-cards">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card stat-card--loading">
            <div className="stat-card__skeleton-icon" />
            <div className="stat-card__skeleton-value" />
            <div className="stat-card__skeleton-label" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-cards">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <div className={`stat-card__icon ${stat.colorClass}`}>{stat.icon}</div>
          <div className="stat-card__value">{stat.value}</div>
          <div className="stat-card__label">{stat.label}</div>
          {stat.subValue && <div className="stat-card__sub">{stat.subValue}</div>}
        </div>
      ))}
    </div>
  );
}
