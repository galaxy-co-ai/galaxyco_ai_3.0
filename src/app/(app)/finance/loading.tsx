import { StatsSkeleton, TableSkeleton, PageHeaderSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Finance Loading State
 * Shown while finance dashboard loads
 */
export default function FinanceLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsSkeleton stats={4} />
      <TableSkeleton rows={6} />
    </div>
  );
}
