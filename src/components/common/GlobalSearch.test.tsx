import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';
import { renderWithProviders } from '@/test/render';

vi.mock('@/services/searchService', () => ({
  searchService: {
    search: vi.fn().mockResolvedValue([]),
  },
}));

describe('GlobalSearch keyboard shortcut', () => {
  it('opens search panel on Cmd+K', () => {
    renderWithProviders(
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>,
    );
    expect(screen.getByText(/搜索工作流、Agent、工具/)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(screen.getByPlaceholderText(/搜索工作流、Agent、知识库、模板/)).toBeInTheDocument();
  });
});
