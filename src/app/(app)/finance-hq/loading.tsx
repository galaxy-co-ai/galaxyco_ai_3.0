import { StatsSkeleton, TableSkeleton, PageHeaderSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Finance HQ Loading State
 * Shown while finance page loads
 */
export default function FinanceLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsSkeleton stats={4} />
      <TableSkeleton rows={10} />
    </div>
  );
}
