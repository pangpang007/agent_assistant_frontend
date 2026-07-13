import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import './Card.css';

export interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export function Card({
  title,
  description,
  children,
  className,
  hoverable = false,
  onClick,
  padding = 'md',
  style,
}: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      className={cn(
        'card',
        `card--padding-${padding}`,
        hoverable && 'card--hoverable',
        onClick && 'card--clickable',
        className,
      )}
      onClick={onClick}
      style={style}
    >
      {(title || description) && (
        <div className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {description && <p className="card__description">{description}</p>}
        </div>
      )}
      <div className="card__body">{children}</div>
    </Component>
  );
}
