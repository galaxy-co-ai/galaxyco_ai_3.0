import { StatsSkeleton, ListSkeleton, PageHeaderSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Insights Loading State
 * Shown while insights/analytics page loads
 */
export default function InsightsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsSkeleton stats={4} />
      <ListSkeleton items={5} />
    </div>
  );
}
