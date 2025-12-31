import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Workflows Loading State
 * Shown while workflows list loads
 */
export default function WorkflowsLoading() {
  return <PageLoadingSkeleton type="table" />;
}
