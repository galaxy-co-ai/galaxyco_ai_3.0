import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { neptuneActivityLog } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

// Color palette for user avatars
const USER_COLORS = ['#4ADE80', '#38BDF8', '#FB7185', '#FBBF24', '#A78BFA', '#F472B6'];

/**
 * GET /api/neptune-hq/recent-activity
 * Returns recent activity log entries from the database
 */
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const activities = await db.query.neptuneActivityLog.findMany({
      where: eq(neptuneActivityLog.workspaceId, workspaceId),
      orderBy: [desc(neptuneActivityLog.createdAt)],
      limit: 20,
      with: {
        user: true,
      },
    });

    const formattedActivities = activities.map((activity, index) => {
      const userName = activity.user?.firstName && activity.user?.lastName
        ? `${activity.user.firstName} ${activity.user.lastName}`
        : activity.user?.email?.split('@')[0] || 'Unknown';

      return {
        id: activity.id,
        user: {
          name: userName,
          avatar: activity.user?.avatarUrl || null,
          color: USER_COLORS[index % USER_COLORS.length],
        },
        action: activity.action,
        description: activity.description,
        timestamp: activity.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ activities: formattedActivities });
  } catch (error) {
    return createErrorResponse(error, 'Recent activity error');
  }
}
