import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Connected Apps Loading State
 * Shown while integrations page loads
 */
export default function ConnectedAppsLoading() {
  return <PageLoadingSkeleton type="cards" />;
}
