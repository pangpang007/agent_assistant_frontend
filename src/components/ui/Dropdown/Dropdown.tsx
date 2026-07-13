import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/useClickOutside';
import './Dropdown.css';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (key: string) => void;
  align?: 'left' | 'right';
  width?: number;
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  align = 'left',
  width,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className={cn('dropdown', className)} ref={ref}>
      <div className="dropdown__trigger" onClick={() => setOpen((v) => !v)}>
        {trigger}
      </div>
      {open && (
        <div
          className={cn('dropdown__menu', align === 'right' && 'dropdown__menu--right')}
          style={{ width }}
          role="menu"
        >
          {items.map((item) => (
            <div key={item.key}>
              <button
                type="button"
                className={cn(
                  'dropdown__item',
                  item.danger && 'dropdown__item--danger',
                  item.disabled && 'dropdown__item--disabled',
                )}
                disabled={item.disabled}
                role="menuitem"
                onClick={() => {
                  if (item.disabled) return;
                  onSelect(item.key);
                  setOpen(false);
                }}
              >
                {item.icon && <span className="dropdown__item-icon">{item.icon}</span>}
                {item.label}
              </button>
              {item.divider && <div className="dropdown__divider" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
