import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Admin Loading State
 * Shown while admin dashboard loads
 */
export default function AdminLoading() {
  return <PageLoadingSkeleton type="table" />;
}
