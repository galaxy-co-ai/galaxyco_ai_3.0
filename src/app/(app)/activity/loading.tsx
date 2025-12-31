import { TimelineSkeleton, PageHeaderSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Activity Loading State
 * Shown while activity feed loads
 */
export default function ActivityLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TimelineSkeleton events={6} />
    </div>
  );
}
