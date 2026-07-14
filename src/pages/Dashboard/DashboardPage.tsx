import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bot,
  GitBranch,
  ArrowRight,
  Plus,
  Wrench,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import '../pages.css';
import './DashboardPage.css';

const shortcuts = [
  {
    key: 'workflows',
    title: '工作流',
    description: '编排 Agent、知识库与工具节点，构建可运行流程',
    to: '/workflows',
    createTo: '/workflows/new',
    icon: GitBranch,
  },
  {
    key: 'agents',
    title: 'Agent',
    description: '配置提示词、模型与工具，管理你的智能助手',
    to: '/agents',
    createTo: '/agents/create',
    icon: Bot,
  },
  {
    key: 'knowledge',
    title: '知识库',
    description: '上传文档、分块向量化，为 Agent 提供检索能力',
    to: '/knowledge',
    createTo: '/knowledge',
    icon: BookOpen,
  },
  {
    key: 'tools',
    title: '工具',
    description: '接入 OpenAPI / HTTP 工具，扩展 Agent 能力边界',
    to: '/tools',
    createTo: '/tools/create',
    icon: Wrench,
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.username || user?.email?.split('@')[0] || '开发者';

  return (
    <div className="page-container page-container--list dashboard-page">
      <header className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">汤圆代码助手</p>
          <h1 className="page-title">你好，{displayName}</h1>
          <p className="page-description">
            从工作流、Agent、知识库或工具开始，构建你的下一次自动化。
          </p>
        </div>
        <div className="dashboard-page__hero-actions">
          <Button
            variant="primary"
            leftIcon={<Plus size={16} strokeWidth={1.5} />}
            onClick={() => navigate('/workflows/new')}
          >
            新建工作流
          </Button>
        </div>
      </header>

      <section className="dashboard-page__stats" aria-label="概览">
        <div className="dashboard-stat">
          <span className="dashboard-stat__label">快捷入口</span>
          <span className="dashboard-stat__value">{shortcuts.length}</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat__label">当前账号</span>
          <span className="dashboard-stat__value dashboard-stat__value--sm">
            {user?.user_type === 'team' ? '团队' : '个人'}
          </span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat__label">准备就绪</span>
          <span className="dashboard-stat__value dashboard-stat__value--sm">可开始</span>
        </div>
      </section>

      <section className="dashboard-page__grid" aria-label="模块入口">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key} hoverable className="dashboard-card" padding="md">
              <div className="dashboard-card__top">
                <div className="dashboard-card__icon">
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <h2 className="dashboard-card__title">{item.title}</h2>
              </div>
              <p className="dashboard-card__desc">{item.description}</p>
              <div className="dashboard-card__actions">
                <Link className="dashboard-card__link" to={item.to}>
                  进入
                  <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
                <Link className="dashboard-card__link dashboard-card__link--muted" to={item.createTo}>
                  新建
                </Link>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
