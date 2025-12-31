import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Lunar Labs Loading State
 * Shown while experiments page loads
 */
export default function LunarLabsLoading() {
  return <PageLoadingSkeleton type="cards" />;
}
