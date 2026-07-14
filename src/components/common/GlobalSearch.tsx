import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Bot,
  GitBranch,
  LayoutTemplate,
  Search,
  Wrench,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Tag } from '@/components/ui/Tag';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { searchService } from '@/services/searchService';
import type { SearchResult, SearchResultType } from '@/types/phase7';
import './GlobalSearch.css';

const GROUP_LABELS: Record<string, string> = {
  workflow: '工作流',
  agent: 'Agent',
  knowledge: '知识库',
  template: '模板',
  tool: '工具',
};

const GROUP_ICONS: Record<string, React.ReactNode> = {
  workflow: <GitBranch size={14} strokeWidth={1.5} />,
  agent: <Bot size={14} strokeWidth={1.5} />,
  knowledge: <BookOpen size={14} strokeWidth={1.5} />,
  template: <LayoutTemplate size={14} strokeWidth={1.5} />,
  tool: <Wrench size={14} strokeWidth={1.5} />,
};

function navigatePath(type: SearchResultType, id: string): string {
  switch (type) {
    case 'workflow':
      return `/workflows/${id}`;
    case 'agent':
      return `/agents/${id}/view`;
    case 'knowledge':
      return `/knowledge/${id}`;
    case 'template':
      return `/templates?highlight=${id}`;
    case 'tool':
      return `/tools/${id}/edit`;
    default:
      return '/dashboard';
  }
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchService.search>>>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);

  const allItems = useMemo(() => results.flatMap((group) => group.items), [results]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          if (prev) {
            setQuery('');
            setResults([]);
            setSelectedIndex(-1);
          }
          return !prev;
        });
      }
      if (e.key === 'Escape' && open) {
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      try {
        const data = await searchService.search(debouncedQuery, controller.signal);
        setResults(data);
        setSelectedIndex(-1);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void run();
    return () => controller.abort();
  }, [debouncedQuery]);

  const navigateToItem = useCallback(
    (item: SearchResult) => {
      close();
      navigate(navigatePath(item.type, item.id));
    },
    [close, navigate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && allItems[selectedIndex]) {
            navigateToItem(allItems[selectedIndex]);
          }
          break;
        default:
          break;
      }
    },
    [allItems, navigateToItem, selectedIndex],
  );

  useEffect(() => {
    if (selectedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) {
    return (
      <button type="button" className="global-search-trigger" onClick={() => setOpen(true)}>
        <Search size={14} strokeWidth={1.5} />
        <span className="global-search-trigger__label">搜索工作流、Agent、工具...</span>
        <Tag color="default" className="global-search-trigger__kbd">
          ⌘K
        </Tag>
      </button>
    );
  }

  return (
    <div className="global-search-overlay" onClick={close}>
      <div className="global-search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-input-wrapper">
          <Search size={16} strokeWidth={1.5} className="global-search-input-icon" />
          <input
            ref={inputRef}
            className="global-search-input"
            placeholder="搜索工作流、Agent、知识库、模板..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="global-search-esc">ESC</kbd>
        </div>

        <div className="global-search-results" ref={listRef}>
          {loading && (
            <div className="global-search-loading">
              <Spinner size="sm" /> 搜索中...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="global-search-empty">未找到匹配「{query}」的结果</div>
          )}

          {!loading &&
            results.map((group, groupIndex) => {
              const groupOffset = results
                .slice(0, groupIndex)
                .reduce((acc, g) => acc + g.items.length, 0);
              return (
                <div key={group.type} className="global-search-group">
                  <div className="global-search-group__header">
                    {GROUP_ICONS[group.type]}
                    <span>{group.label ?? GROUP_LABELS[group.type] ?? group.type}</span>
                    <span className="global-search-group__count">{group.items.length}</span>
                  </div>
                  {group.items.map((item, itemIndex) => {
                    const globalIdx = groupOffset + itemIndex;
                    return (
                      <div
                        key={`${group.type}-${item.id}`}
                        data-index={globalIdx}
                        className={cn('global-search-item', {
                          'global-search-item--selected': globalIdx === selectedIndex,
                        })}
                        onClick={() => navigateToItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div className="global-search-item__icon">
                          {GROUP_ICONS[group.type] ?? GROUP_ICONS.workflow}
                        </div>
                        <div className="global-search-item__content">
                          <span className="global-search-item__title">{item.title}</span>
                          {item.subtitle && (
                            <span className="global-search-item__subtitle">{item.subtitle}</span>
                          )}
                        </div>
                        <ArrowRight size={14} strokeWidth={1.5} className="global-search-item__arrow" />
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>

        <div className="global-search-footer">
          <span>
            <kbd>↑↓</kbd> 导航
          </span>
          <span>
            <kbd>↵</kbd> 跳转
          </span>
          <span>
            <kbd>esc</kbd> 关闭
          </span>
        </div>
      </div>
    </div>
  );
}
