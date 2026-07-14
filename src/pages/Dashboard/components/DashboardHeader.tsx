import { useAuthStore } from '@/stores/authStore';

export function DashboardHeader() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.username || '汤圆';

  return (
    <div className="dashboard-header">
      <h1 className="dashboard-header__title">Dashboard</h1>
      <p className="dashboard-header__greeting">欢迎回来，{displayName} 👋</p>
    </div>
  );
}
