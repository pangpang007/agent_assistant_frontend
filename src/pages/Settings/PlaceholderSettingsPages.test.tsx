import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import EnvVarsPage from './EnvVarsPage';
import PersonalSettingsPage from './PersonalSettingsPage';
import { renderAtRoute } from '@/test/render';

describe('Settings placeholder pages (Phase 0)', () => {
  it('EnvVarsPage renders placeholder', () => {
    renderAtRoute(<EnvVarsPage />, { path: '/settings/env', route: '/settings/env' });
    expect(screen.getByRole('heading', { name: '环境变量' })).toBeInTheDocument();
    expect(screen.getByText(/待实现/)).toBeInTheDocument();
  });

  it('PersonalSettingsPage renders placeholder', () => {
    renderAtRoute(<PersonalSettingsPage />, {
      path: '/settings/personal',
      route: '/settings/personal',
    });
    expect(screen.getByRole('heading', { name: '个人设置' })).toBeInTheDocument();
  });
});
