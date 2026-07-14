import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import './ListPagination.css';

export interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}

/** Lightweight pager for card-grid list pages (binds to store.total). */
export function ListPagination({
  page,
  pageSize,
  total,
  onChange,
  className,
}: ListPaginationProps) {
  if (total <= 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className={cn('list-pagination', className)}>
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        上一页
      </Button>
      <span className="list-pagination__info">
        第 {page} / {totalPages} 页 · 共 {total} 条
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        下一页
      </Button>
    </div>
  );
}
