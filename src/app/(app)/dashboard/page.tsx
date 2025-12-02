import { Metadata } from 'next';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import DashboardV2Client from '@/components/dashboard-v2/DashboardV2Client';
import { getCurrentWorkspace } from '@/lib/auth';
import { getDashboardData, getEmptyDashboardData } from '@/lib/dashboard-v2';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'Dashboard | GalaxyCo.ai',
  description: 'Your personalized AI command center - guided, intelligent, and always helpful',
};

/**
 * Dashboard Page (User-First Design v2)
 * 
 * Fetches data server-side and passes to client component.
 * Client component uses SWR for real-time updates.
 */
export default async function DashboardPage() {
  let initialData;
  
  try {
    const { workspaceId } = await getCurrentWorkspace();
    logger.info('Loading dashboard for workspace', { workspaceId });
    initialData = await getDashboardData(workspaceId);
  } catch (error) {
    logger.error('Failed to load initial dashboard data', { error });
    // Fall back to empty data if server-side fetch fails
    initialData = getEmptyDashboardData();
  }

  return (
    <ErrorBoundary>
      <DashboardV2Client initialData={initialData} />
    </ErrorBoundary>
  );
}
