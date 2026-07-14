import { DashboardHeader } from './components/DashboardHeader';
import { QuickActions } from './components/QuickActions';
import { RecentExecutions } from './components/RecentExecutions';
import { RecentWorkflows } from './components/RecentWorkflows';
import { StatsCards } from './components/StatsCards';
import { TokenTrendChart } from './components/TokenTrendChart';
import '../pages.css';
import './DashboardPage.css';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <DashboardHeader />
      <QuickActions />
      <StatsCards />
      <div className="dashboard-page__middle">
        <RecentWorkflows />
        <TokenTrendChart />
      </div>
      <RecentExecutions />
    </div>
  );
}
