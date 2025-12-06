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
  title: 'Neptune AI | GalaxyCo.ai',
  description: 'Your AI assistant is ready to help you build and grow your workspace. Start a conversation and let Neptune guide you.',
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
    // Log error but don't expose details to user
    logger.error('Dashboard v2 page error', { error });
    // initialData already set to empty state fallback
  }

  return (
    <ErrorBoundary>
      <DashboardV2Client 
        initialData={initialData} 
        userId={userId}
        workspaceId={workspaceId}
        userName={userName}
      />
    </ErrorBoundary>
  );
}
