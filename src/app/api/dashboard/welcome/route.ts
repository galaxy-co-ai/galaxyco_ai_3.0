/**
 * Dashboard Welcome API
 * 
 * Returns contextual welcome data for Neptune dashboard greeting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { isNewUser, getRecentActivity, getWorkspaceHealth } from '@/lib/user-activity';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');

    // If userId/workspaceId provided, use them; otherwise get from auth
    let finalUserId = userId;
    let finalWorkspaceId = workspaceId;

    if (!finalUserId || !finalWorkspaceId) {
      const { userId: authUserId, workspaceId: authWorkspaceId } =
        await getCurrentWorkspace();
      finalUserId = finalUserId || authUserId;
      finalWorkspaceId = finalWorkspaceId || authWorkspaceId;
    }

    if (!finalUserId || !finalWorkspaceId) {
      return NextResponse.json(
        { error: 'User or workspace not found' },
        { status: 401 }
      );
    }

    // Fetch welcome data in parallel
    const [isNew, recentActivity, workspaceHealth] = await Promise.all([
      isNewUser(finalUserId),
      getRecentActivity(finalWorkspaceId),
      getWorkspaceHealth(finalWorkspaceId),
    ]);

    return NextResponse.json({
      isNewUser: isNew,
      recentActivity,
      workspaceHealth,
    });
  } catch (error) {
    logger.error('Error fetching welcome data', { error });
    return NextResponse.json(
      { error: 'Failed to fetch welcome data' },
      { status: 500 }
    );
  }
}
