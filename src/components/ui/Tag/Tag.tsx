import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import './Tag.css';

export type TagColor = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface TagProps {
  color?: TagColor;
  children: ReactNode;
  closable?: boolean;
  onClose?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function Tag({
  color = 'default',
  children,
  closable = false,
  onClose,
  icon,
  className,
}: TagProps) {
  return (
    <span className={cn('tag', `tag--${color}`, className)}>
      {icon && <span className="tag__icon">{icon}</span>}
      {children}
      {closable && (
        <button type="button" className="tag__close" onClick={onClose} aria-label="关闭">
          <X size={12} strokeWidth={1.5} />
        </button>
      )}
    </span>
  );
}

export interface BadgeProps {
  count?: number;
  dot?: boolean;
  color?: TagColor;
  children: ReactNode;
  overflowCount?: number;
  className?: string;
}

export function Badge({
  count,
  dot = false,
  color = 'danger',
  children,
  overflowCount = 99,
  className,
}: BadgeProps) {
  const showBadge = dot || (count !== undefined && count > 0);
  const displayCount =
    count !== undefined && count > overflowCount ? `${overflowCount}+` : count;

  return (
    <span className={cn('badge', className)}>
      {children}
      {showBadge && (
        <span
          className={cn(
            'badge__indicator',
            dot && 'badge__indicator--dot',
            !dot && `badge__indicator--${color}`,
          )}
        >
          {!dot && displayCount}
        </span>
      )}
    </span>
  );
}
