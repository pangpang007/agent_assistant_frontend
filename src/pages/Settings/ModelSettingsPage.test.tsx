import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ModelSettingsPage from './ModelSettingsPage';
import { mockSupplier } from '@/test/fixtures';
import { renderAtRoute, setAuthenticatedUser } from '@/test/render';
import { modelService } from '@/services/modelService';

vi.mock('@/services/modelService', () => ({
  modelService: {
    getSuppliers: vi.fn(),
    getUsage: vi.fn(),
    createSupplier: vi.fn(),
    updateSupplier: vi.fn(),
    deleteSupplier: vi.fn(),
    toggleSupplierStatus: vi.fn(),
    setDefaultModel: vi.fn(),
  },
}));

describe('ModelSettingsPage (Phase 2)', () => {
  beforeEach(() => {
    setAuthenticatedUser();
    vi.mocked(modelService.getSuppliers).mockResolvedValue({ suppliers: [mockSupplier] });
    vi.mocked(modelService.getUsage).mockResolvedValue({
      records: [],
      summary: { total_input_tokens: 0, total_output_tokens: 0, total_cost: 0 },
    });
  });

  it('renders model management and supplier list', async () => {
    renderAtRoute(<ModelSettingsPage />, {
      path: '/settings/models',
      route: '/settings/models',
    });
    expect(screen.getByRole('heading', { name: '模型管理' })).toBeInTheDocument();
    await waitFor(() => {
      expect(modelService.getSuppliers).toHaveBeenCalled();
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    });
  });

  it('handles null supplier list without crashing', async () => {
    vi.mocked(modelService.getSuppliers).mockResolvedValueOnce({
      suppliers: null as unknown as typeof mockSupplier[],
    });
    renderAtRoute(<ModelSettingsPage />, {
      path: '/settings/models',
      route: '/settings/models',
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '模型管理' })).toBeInTheDocument();
    });
  });
});
