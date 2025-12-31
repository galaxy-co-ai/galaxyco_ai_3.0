import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Approvals Loading State
 * Shown while approvals queue loads
 */
export default function ApprovalsLoading() {
  return <PageLoadingSkeleton type="list" />;
}
