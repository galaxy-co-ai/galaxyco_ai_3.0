import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Library Loading State
 * Shown while templates library loads
 */
export default function LibraryLoading() {
  return <PageLoadingSkeleton type="cards" />;
}
