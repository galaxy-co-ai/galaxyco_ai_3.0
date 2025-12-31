import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Creator Loading State
 * Shown while content creator page loads
 */
export default function CreatorLoading() {
  return <PageLoadingSkeleton type="cards" />;
}
