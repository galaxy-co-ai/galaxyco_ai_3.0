import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Marketing Loading State
 * Shown while marketing page loads
 */
export default function MarketingLoading() {
  return <PageLoadingSkeleton type="table" />;
}
