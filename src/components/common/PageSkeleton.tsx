import { Skeleton } from '@/components/ui/Spinner';
import './PageSkeleton.css';

export function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="加载中">
      <Skeleton width="40%" height={28} variant="rectangular" />
      <Skeleton width="60%" height={16} />
      <div className="page-skeleton__grid">
        <Skeleton variant="rectangular" height={120} />
        <Skeleton variant="rectangular" height={120} />
        <Skeleton variant="rectangular" height={120} />
        <Skeleton variant="rectangular" height={120} />
      </div>
      <Skeleton variant="rectangular" height={280} />
    </div>
  );
}
