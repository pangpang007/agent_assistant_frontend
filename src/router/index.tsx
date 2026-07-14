import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthGuard } from '@/components/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { EditorLayout } from '@/components/layout/EditorLayout';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { ErrorBoundary } from '@/pages/Error/ErrorBoundary';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';

const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const WorkflowListPage = lazy(() => import('@/pages/Workflows/WorkflowListPage'));
const WorkflowEditorPage = lazy(() => import('@/pages/Workflows/WorkflowEditorPage'));
const TemplateLibraryPage = lazy(() => import('@/pages/Templates/TemplateLibraryPage'));
const ExecutionListPage = lazy(() => import('@/pages/Executions/ExecutionListPage'));
const ExecutionDetailPage = lazy(() => import('@/pages/Executions/ExecutionDetailPage'));
const AgentListPage = lazy(() => import('@/pages/Agents/AgentListPage'));
const AgentFormPage = lazy(() => import('@/pages/Agents/AgentFormPage'));
const AgentDetailPage = lazy(() => import('@/pages/Agents/AgentDetailPage'));
const KnowledgeListPage = lazy(() => import('@/pages/Knowledge/KnowledgeListPage'));
const KnowledgeDetailPage = lazy(() => import('@/pages/Knowledge/KnowledgeDetailPage'));
const ToolListPage = lazy(() => import('@/pages/Tools/ToolListPage'));
const ToolFormPage = lazy(() => import('@/pages/Tools/ToolFormPage'));
const ToolTestPage = lazy(() => import('@/pages/Tools/ToolTestPage'));
const LogCenterPage = lazy(() => import('@/pages/Logs/LogCenterPage'));
const ProfilePage = lazy(() => import('@/pages/Settings/ProfilePage'));
const TeamSettingsPage = lazy(() => import('@/pages/Settings/TeamSettingsPage'));
const ModelSettingsPage = lazy(() => import('@/pages/Settings/ModelSettingsPage'));
const EnvVarsPage = lazy(() => import('@/pages/Settings/EnvVarsPage'));
const ApiManagementPage = lazy(() => import('@/pages/Settings/ApiManagementPage'));
const NotFoundPage = lazy(() => import('@/pages/Error/NotFoundPage'));

function SuspenseWrapper({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

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
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: 'dashboard',
            element: (
              <SuspenseWrapper>
                <DashboardPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'workflows',
            element: (
              <SuspenseWrapper>
                <WorkflowListPage />
              </SuspenseWrapper>
            ),
          },
          { path: 'workflows/templates', element: <Navigate to="/templates" replace /> },
          { path: 'workflows/history', element: <Navigate to="/executions" replace /> },
          {
            path: 'templates',
            element: (
              <SuspenseWrapper>
                <TemplateLibraryPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'executions',
            element: (
              <SuspenseWrapper>
                <ExecutionListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'executions/:id',
            element: (
              <SuspenseWrapper>
                <ExecutionDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'agents',
            element: (
              <SuspenseWrapper>
                <AgentListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'agents/create',
            element: (
              <SuspenseWrapper>
                <AgentFormPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'agents/:id/edit',
            element: (
              <SuspenseWrapper>
                <AgentFormPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'agents/:id/view',
            element: (
              <SuspenseWrapper>
                <AgentDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'knowledge',
            element: (
              <SuspenseWrapper>
                <KnowledgeListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'knowledge/:id',
            element: (
              <SuspenseWrapper>
                <KnowledgeDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'tools',
            element: (
              <SuspenseWrapper>
                <ToolListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'tools/create',
            element: (
              <SuspenseWrapper>
                <ToolFormPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'tools/:id/edit',
            element: (
              <SuspenseWrapper>
                <ToolFormPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'tools/:id/test',
            element: (
              <SuspenseWrapper>
                <ToolTestPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'logs',
            element: (
              <SuspenseWrapper>
                <LogCenterPage />
              </SuspenseWrapper>
            ),
          },
          { path: 'settings', element: <Navigate to="/settings/profile" replace /> },
          {
            path: 'settings/profile',
            element: (
              <SuspenseWrapper>
                <ProfilePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'settings/team',
            element: (
              <SuspenseWrapper>
                <TeamSettingsPage />
              </SuspenseWrapper>
            ),
          },
          { path: 'settings/personal', element: <Navigate to="/settings/profile" replace /> },
          {
            path: 'settings/models',
            element: (
              <SuspenseWrapper>
                <ModelSettingsPage />
              </SuspenseWrapper>
            ),
          },
          { path: 'settings/model', element: <Navigate to="/settings/models" replace /> },
          {
            path: 'settings/env',
            element: (
              <SuspenseWrapper>
                <EnvVarsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'settings/api',
            element: (
              <SuspenseWrapper>
                <ApiManagementPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        element: <EditorLayout />,
        children: [
          {
            path: 'workflows/:id',
            element: (
              <SuspenseWrapper>
                <WorkflowEditorPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: '*',
        element: (
          <SuspenseWrapper>
            <NotFoundPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);
