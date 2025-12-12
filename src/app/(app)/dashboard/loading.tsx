import { StatsSkeleton, ListSkeleton } from '@/components/shared/loading-skeletons';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard Loading State
 * Automatically shown by Next.js while dashboard page loads
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Welcome header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* KPI Stats */}
      <StatsSkeleton stats={4} />

      {/* Activity & Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <ListSkeleton items={5} />
        </Card>

        {/* AI Insights */}
        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}
