import { PageLoadingSkeleton } from '@/components/shared/loading-skeletons';

/**
 * Settings Loading State
 * Shown while settings page loads
 */
export default function SettingsLoading() {
  return <PageLoadingSkeleton type="form" />;
}
