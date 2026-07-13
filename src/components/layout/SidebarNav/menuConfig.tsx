import {
  BookOpen,
  Bot,
  GitBranch,
  LayoutDashboard,
  ScrollText,
  Settings,
  Wrench,
} from 'lucide-react';
import type { MenuItemConfig } from '@/components/ui/Sidebar';

export const menuConfig: MenuItemConfig[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={16} strokeWidth={1.5} />,
    path: '/',
  },
  {
    key: 'workflows',
    label: '工作流',
    icon: <GitBranch size={16} strokeWidth={1.5} />,
    children: [
      { key: 'workflow-list', label: '列表', path: '/workflows' },
      { key: 'workflow-editor', label: '编辑器', path: '/workflows/new' },
      { key: 'workflow-templates', label: '模板', path: '/workflows/templates' },
      { key: 'workflow-history', label: '历史', path: '/workflows/history' },
    ],
  },
  {
    key: 'agents',
    label: 'Agent 管理',
    icon: <Bot size={16} strokeWidth={1.5} />,
    path: '/agents',
  },
  {
    key: 'knowledge',
    label: '知识库',
    icon: <BookOpen size={16} strokeWidth={1.5} />,
    path: '/knowledge',
  },
  {
    key: 'tools',
    label: '工具管理',
    icon: <Wrench size={16} strokeWidth={1.5} />,
    path: '/tools',
  },
  {
    key: 'logs',
    label: '日志中心',
    icon: <ScrollText size={16} strokeWidth={1.5} />,
    path: '/logs',
  },
  {
    key: 'settings',
    label: '设置',
    icon: <Settings size={16} strokeWidth={1.5} />,
    children: [
      { key: 'settings-personal', label: '个人资料', path: '/settings/profile' },
      { key: 'settings-team', label: '团队管理', path: '/settings/team' },
      { key: 'settings-model', label: '模型管理', path: '/settings/models' },
      { key: 'settings-env', label: '环境变量', path: '/settings/env' },
    ],
  },
];

export function getActiveMenuKey(pathname: string): string {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/workflows/new')) return 'workflow-editor';
  if (pathname.startsWith('/workflows/templates')) return 'workflow-templates';
  if (pathname.startsWith('/workflows/history')) return 'workflow-history';
  if (pathname.startsWith('/workflows')) return 'workflow-list';
  if (pathname.startsWith('/agents')) return 'agents';
  if (pathname.startsWith('/knowledge')) return 'knowledge';
  if (pathname.startsWith('/tools')) return 'tools';
  if (pathname.startsWith('/logs')) return 'logs';
  if (pathname.startsWith('/settings/profile')) return 'settings-personal';
  if (pathname.startsWith('/settings/team')) return 'settings-team';
  if (pathname.startsWith('/settings/models') || pathname.startsWith('/settings/model')) return 'settings-model';
  if (pathname.startsWith('/settings/env')) return 'settings-env';
  return '';
}
