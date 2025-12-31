import { StatsSkeleton, TableSkeleton, PageHeaderSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Orchestration Loading State
 * Shown while orchestration dashboard loads
 */
export default function OrchestrationLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsSkeleton stats={4} />
      <TableSkeleton rows={5} />
    </div>
  );
}
