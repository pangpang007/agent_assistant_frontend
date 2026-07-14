import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import { mockUser, renderAtRoute, setAuthenticatedUser } from '@/test/render';

describe('DashboardPage (Phase 0)', () => {
  beforeEach(() => {
    setAuthenticatedUser(mockUser);
  });

  it('renders greeting and module shortcuts', () => {
    renderAtRoute(<DashboardPage />, { path: '/', route: '/' });
    expect(screen.getByRole('heading', { name: /你好，测试用户/ })).toBeInTheDocument();
    expect(screen.getByText('汤圆代码助手')).toBeInTheDocument();
    expect(screen.getByText('工作流')).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('知识库')).toBeInTheDocument();
    expect(screen.getByText('工具')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /新建工作流/ })).toBeInTheDocument();
  });
});
