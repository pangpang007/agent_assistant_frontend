import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import EnvVarsPage from './EnvVarsPage';
import PersonalSettingsPage from './PersonalSettingsPage';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';

vi.mock('@/services/envService', () => ({
  envService: {
    getEnvVars: vi.fn().mockResolvedValue([]),
    createEnvVar: vi.fn(),
    updateEnvVar: vi.fn(),
    deleteEnvVar: vi.fn(),
  },
}));

describe('Settings pages', () => {
  beforeEach(() => {
    setAuthenticatedUser();
  });

  it('EnvVarsPage renders env management (Phase 6)', async () => {
    renderAtRoute(<EnvVarsPage />, { path: '/settings/env', route: '/settings/env' });
    expect(screen.getByRole('heading', { name: '环境变量' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /新建|添加/ })).toBeInTheDocument();
    });
  });

  it('PersonalSettingsPage renders placeholder', () => {
    renderAtRoute(<PersonalSettingsPage />, {
      path: '/settings/personal',
      route: '/settings/personal',
    });
    expect(screen.getByRole('heading', { name: '个人设置' })).toBeInTheDocument();
  });
});
