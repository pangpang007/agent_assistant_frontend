import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Tag } from '../Tag';
import './Tabs.css';

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  children?: ReactNode;
  className?: string;
}

export function Tabs({ items, activeKey, onChange, children, className }: TabsProps) {
  return (
    <div className={cn('tabs', className)}>
      <div className="tabs__list" role="tablist">
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={item.disabled}
              className={cn(
                'tabs__tab',
                active && 'tabs__tab--active',
                item.disabled && 'tabs__tab--disabled',
              )}
              onClick={() => !item.disabled && onChange(item.key)}
            >
              {item.icon && <span className="tabs__icon">{item.icon}</span>}
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <Tag color="primary">{item.badge}</Tag>
              )}
            </button>
          );
        })}
      </div>
      {children && <div className="tabs__content">{children}</div>}
    </div>
  );
}
