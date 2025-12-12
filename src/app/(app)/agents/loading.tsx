import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Agents Loading State
 * Shown while agents page loads
 */
export default function AgentsLoading() {
  return <PageLoadingSkeleton type="cards" />;
}
