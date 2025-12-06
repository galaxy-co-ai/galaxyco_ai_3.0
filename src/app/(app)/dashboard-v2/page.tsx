/**
 * Dashboard v2 Page
 * 
 * User-first redesigned dashboard focused on guiding users to success
 * rather than showcasing features.
 * 
 * This is a server component that fetches data and passes it to the client.
 */

import { Metadata } from 'next';
import { getCurrentWorkspace } from '@/lib/auth';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { getDashboardData, getEmptyDashboardData } from '@/lib/dashboard-v2';
import DashboardV2Client from '@/components/dashboard-v2/DashboardV2Client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard | GalaxyCo.ai',
  description: 'Your personalized AI command center - guided, intelligent, and always helpful',
};

/**
 * Dashboard v2 Server Component
 * 
 * Fetches data server-side for fast initial load, then passes to client
 * component for interactivity and real-time updates.
 */
export default async function DashboardV2Page() {
  // Always render the same JSX tree; just vary the data we pass in.
  let initialData = getEmptyDashboardData();

  try {
    // Get authenticated workspace
    const { workspaceId } = await getCurrentWorkspace();

    // Fetch dashboard data
    initialData = await getDashboardData(workspaceId);
  } catch (error) {
    // Log error but don't expose details to user
    logger.error('Dashboard v2 page error', { error });
    // initialData already set to empty state fallback
  }

  return (
    <ErrorBoundary>
      <DashboardV2Client initialData={initialData} />
    </ErrorBoundary>
  );
}
