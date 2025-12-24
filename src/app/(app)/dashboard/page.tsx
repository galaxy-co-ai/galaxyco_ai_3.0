import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import DashboardV2Client from '@/components/dashboard/DashboardV2Client';
import { getCurrentWorkspace } from '@/lib/auth';
import { getDashboardData, getEmptyDashboardData } from '@/lib/dashboard';
import { logger } from '@/lib/logger';
import DashboardLoading from './loading';

export const dynamic = 'force-dynamic';

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
  // Always render the same JSX tree; just vary the data we pass in.
  let initialData = getEmptyDashboardData();
  let userId = '';
  let workspaceId = '';
  let userName = 'there';

  try {
    // Get authenticated workspace and user
    const { userId: authUserId, workspaceId: authWorkspaceId } = await getCurrentWorkspace();
    userId = authUserId;
    workspaceId = authWorkspaceId;

    // Get user info for personalized greeting
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (user) {
      userName = user.firstName || user.email?.split('@')[0] || 'there';
    }

    // Fetch dashboard data
    if (workspaceId) {
      initialData = await getDashboardData(workspaceId, userName);
    }
  } catch (error) {
    // Redirect to sign-in if unauthorized
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/sign-in');
    }
    // Log error but don't expose details to user
    logger.error('Dashboard page error', { error });
    // initialData already set to empty state fallback
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardLoading />}>
        <DashboardV2Client 
          initialData={initialData} 
          userId={userId}
          workspaceId={workspaceId}
          userName={userName}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
