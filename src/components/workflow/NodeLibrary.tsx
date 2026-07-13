import { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { useDebounce } from '@/hooks/useDebounce';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import { nodeLibraryGroups } from './nodeLibraryConfig';
import { NodeLibraryItem } from './NodeLibraryItem';

export function NodeLibrary() {
  const collapsed = useWorkflowEditorStore((s) => s.isNodeLibraryCollapsed);
  const toggle = useWorkflowEditorStore((s) => s.toggleNodeLibrary);
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const debouncedSearch = useDebounce(search, 200);

  const filteredGroups = useMemo(() => {
    if (!debouncedSearch.trim()) return nodeLibraryGroups;
    const q = debouncedSearch.toLowerCase();
    return nodeLibraryGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [debouncedSearch]);

  const toggleGroup = (name: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (collapsed) {
    return (
      <div className="node-library node-library--collapsed">
        <Button variant="ghost" size="sm" onClick={toggle} aria-label="展开节点库">
          <ChevronRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <aside className="node-library">
      <div className="node-library__header">
        <span className="node-library__title">节点库</span>
        <Button variant="ghost" size="sm" onClick={toggle} aria-label="折叠节点库">
          <ChevronLeft size={16} />
        </Button>
      </div>
      <div className="node-library__search">
        <Input
          size="sm"
          placeholder="搜索节点..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={14} />}
        />
      </div>
      <div className="node-library__groups">
        {filteredGroups.map((group) => {
          const isGroupCollapsed = collapsedGroups[group.name];
          return (
            <div key={group.name} className="node-library__group">
              <button
                type="button"
                className="node-library__group-header"
                onClick={() => toggleGroup(group.name)}
              >
                <ChevronDown
                  size={14}
                  className={isGroupCollapsed ? 'node-library__chevron--collapsed' : undefined}
                />
                <span>{group.name}</span>
                <Tag color="default">{group.items.length}</Tag>
              </button>
              {!isGroupCollapsed &&
                group.items.map((item) => (
                  <NodeLibraryItem key={item.type} {...item} />
                ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
