import http from '@/lib/axios';
import { pickList } from '@/lib/arrayUtils';
import type { SearchGroup, SearchResult } from '@/types/phase7';

export const searchService = {
  search: async (query: string, signal?: AbortSignal): Promise<SearchGroup[]> => {
    if (!query.trim()) return [];
    try {
      const res = await http.get('/search', {
        params: { q: query.trim(), limit: 5 },
        signal,
      });
      const groups = pickList<SearchGroup>(res, ['groups', 'data', 'results']);
      if (groups.length) return groups;

      // Flat list fallback
      const items = pickList<SearchResult>(res, ['items']);
      if (!items.length) return [];
      const byType = new Map<string, SearchResult[]>();
      for (const item of items) {
        const list = byType.get(item.type) ?? [];
        list.push(item);
        byType.set(item.type, list);
      }
      return Array.from(byType.entries()).map(([type, groupItems]) => ({
        type,
        items: groupItems,
      }));
    } catch (err) {
      if ((err as { name?: string })?.name === 'CanceledError' || (err as { code?: string })?.code === 'ERR_CANCELED') {
        return [];
      }
      throw err;
    }
  },
};
