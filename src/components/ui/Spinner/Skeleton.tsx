import { cn } from '@/lib/utils';
import './Skeleton.css';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  gap?: string;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  gap = 'var(--space-2)',
  className,
}: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn('skeleton', 'skeleton--text', i === lines - 1 && 'skeleton--text-last')}
            style={{ width: i === lines - 1 ? '60%' : width }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('skeleton', `skeleton--${variant}`, className)}
      style={{
        width,
        height: height ?? (variant === 'text' ? '14px' : undefined),
      }}
    />
  );
}
