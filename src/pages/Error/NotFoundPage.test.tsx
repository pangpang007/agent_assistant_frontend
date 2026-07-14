import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotFoundPage from './NotFoundPage';
import { renderAtRoute } from '@/test/render';

describe('NotFoundPage (Phase 7)', () => {
  it('renders 404 page and navigates home', async () => {
    const user = userEvent.setup();
    renderAtRoute(<NotFoundPage />, {
      path: '*',
      route: '/missing',
      extraRoutes: [{ path: '/dashboard', element: <div>首页</div> }],
    });

    expect(screen.getByText('页面不存在')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '返回首页' }));
    expect(await screen.findByText('首页')).toBeInTheDocument();
  });
});
