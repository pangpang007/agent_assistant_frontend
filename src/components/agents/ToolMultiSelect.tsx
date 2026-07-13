import { Check } from 'lucide-react';
import { Tag } from '@/components/ui/Tag';
import { cn } from '@/lib/utils';
import type { Tool } from '@/types';
import './ToolMultiSelect.css';

export interface ToolMultiSelectProps {
  availableTools: Tool[];
  selectedToolIds: string[];
  onChange: (toolIds: string[]) => void;
}

export function ToolMultiSelect({ availableTools, selectedToolIds, onChange }: ToolMultiSelectProps) {
  const toggle = (id: string) => {
    if (selectedToolIds.includes(id)) {
      onChange(selectedToolIds.filter((t) => t !== id));
    } else {
      onChange([...selectedToolIds, id]);
    }
  };

  return (
    <div className="tool-multi-select">
      <div className="tool-multi-select__grid">
        {availableTools.map((tool) => {
          const selected = selectedToolIds.includes(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              className={cn('tool-multi-select__item', selected && 'tool-multi-select__item--selected')}
              onClick={() => toggle(tool.id)}
            >
              <span className={cn('tool-multi-select__checkbox', selected && 'tool-multi-select__checkbox--checked')}>
                {selected && <Check size={12} strokeWidth={2} />}
              </span>
              <span className="tool-multi-select__name">{tool.name}</span>
              <Tag color={tool.type === 'preset' ? 'primary' : 'success'}>
                {tool.type === 'preset' ? '预置' : '自定义'}
              </Tag>
            </button>
          );
        })}
      </div>
      <p className="tool-multi-select__count">已选择 {selectedToolIds.length} 个工具</p>
    </div>
  );
}
