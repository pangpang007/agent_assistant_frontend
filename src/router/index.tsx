import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthGuard } from '@/components/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { EditorLayout } from '@/components/layout/EditorLayout';
import { ErrorBoundary } from '@/pages/Error/ErrorBoundary';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import WorkflowListPage from '@/pages/Workflows/WorkflowListPage';
import WorkflowEditorPage from '@/pages/Workflows/WorkflowEditorPage';
import WorkflowTemplatePage from '@/pages/Workflows/WorkflowTemplatePage';
import WorkflowHistoryPage from '@/pages/Workflows/WorkflowHistoryPage';
import AgentListPage from '@/pages/Agents/AgentListPage';
import AgentFormPage from '@/pages/Agents/AgentFormPage';
import AgentDetailPage from '@/pages/Agents/AgentDetailPage';
import KnowledgeListPage from '@/pages/Knowledge/KnowledgeListPage';
import KnowledgeDetailPage from '@/pages/Knowledge/KnowledgeDetailPage';
import ToolListPage from '@/pages/Tools/ToolListPage';
import ToolFormPage from '@/pages/Tools/ToolFormPage';
import ToolTestPage from '@/pages/Tools/ToolTestPage';
import LogCenterPage from '@/pages/Logs/LogCenterPage';
import ProfilePage from '@/pages/Settings/ProfilePage';
import TeamSettingsPage from '@/pages/Settings/TeamSettingsPage';
import ModelSettingsPage from '@/pages/Settings/ModelSettingsPage';
import EnvVarsPage from '@/pages/Settings/EnvVarsPage';
import NotFoundPage from '@/pages/Error/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: (
      <ErrorBoundary>
        <AuthGuard>
          <Outlet />
        </AuthGuard>
      </ErrorBoundary>
    ),
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'workflows', element: <WorkflowListPage /> },
          { path: 'workflows/templates', element: <WorkflowTemplatePage /> },
          { path: 'workflows/history', element: <WorkflowHistoryPage /> },
          { path: 'agents', element: <AgentListPage /> },
          { path: 'agents/create', element: <AgentFormPage /> },
          { path: 'agents/:id/edit', element: <AgentFormPage /> },
          { path: 'agents/:id/view', element: <AgentDetailPage /> },
          { path: 'knowledge', element: <KnowledgeListPage /> },
          { path: 'knowledge/:id', element: <KnowledgeDetailPage /> },
          { path: 'tools', element: <ToolListPage /> },
          { path: 'tools/create', element: <ToolFormPage /> },
          { path: 'tools/:id/edit', element: <ToolFormPage /> },
          { path: 'tools/:id/test', element: <ToolTestPage /> },
          { path: 'logs', element: <LogCenterPage /> },
          { path: 'settings', element: <Navigate to="/settings/profile" replace /> },
          { path: 'settings/profile', element: <ProfilePage /> },
          { path: 'settings/team', element: <TeamSettingsPage /> },
          { path: 'settings/personal', element: <Navigate to="/settings/profile" replace /> },
          { path: 'settings/models', element: <ModelSettingsPage /> },
          { path: 'settings/model', element: <Navigate to="/settings/models" replace /> },
          { path: 'settings/env', element: <EnvVarsPage /> },
        ],
      },
      {
        element: <EditorLayout />,
        children: [
          // /workflows/new 与 /workflows/:id 共用编辑器；new 作为 id 触发创建流程
          { path: 'workflows/:id', element: <WorkflowEditorPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
