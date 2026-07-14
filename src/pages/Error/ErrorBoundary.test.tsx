import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { renderWithProviders } from '@/test/render';

function Boom(): never {
  throw new Error('boom');
}

describe('ErrorBoundary (Phase 0)', () => {
  it('shows fallback UI when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(
      <MemoryRouter>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('出错了')).toBeInTheDocument();
    expect(screen.getByText('应用遇到了意外错误')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    spy.mockRestore();
  });
});
