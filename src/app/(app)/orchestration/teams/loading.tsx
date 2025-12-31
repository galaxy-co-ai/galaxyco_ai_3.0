import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Teams Loading State
 * Shown while teams list loads
 */
export default function TeamsLoading() {
  return <PageLoadingSkeleton type="table" />;
}
