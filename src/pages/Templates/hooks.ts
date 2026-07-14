import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListPage } from '@/hooks/useListPage';
import type { TemplateCategory } from '@/types/phase6';
import { useTemplateListStore } from './store';

export function useTemplateListPage() {
  const navigate = useNavigate();
  const listPage = useListPage(useTemplateListStore, { autoFetch: true });
  const setFilters = useTemplateListStore((s) => s.setFilters);
  const [searchInput, setSearchInput] = useState('');
  const [source, setSourceState] = useState<'all' | 'official' | 'custom'>('all');
  const [category, setCategoryState] = useState<TemplateCategory | 'all'>('all');

  useEffect(() => {
    setFilters({ source, category });
  }, [source, category, setFilters]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    listPage.debouncedSearch(value);
  };

  return {
    ...listPage,
    searchInput,
    source,
    category,
    navigate,
    handleSearchChange,
    setSource: setSourceState,
    setCategory: setCategoryState,
  };
}
