import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * CRM Loading State
 * Shown while CRM contacts/deals load
 */
export default function CRMLoading() {
  return <PageLoadingSkeleton type="table" />;
}
