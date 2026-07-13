import { cn } from '@/lib/utils';
import './Spinner.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return <span className={cn('spinner', `spinner--${size}`, className)} aria-label="加载中" />;
}
