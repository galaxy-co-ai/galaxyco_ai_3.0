/**
 * Dismiss Insight API
 * 
 * POST /api/insights/[id]/dismiss - Dismiss a proactive insight
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { proactiveInsights } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Dismiss insight');
    }

    const workspaceId = (sessionClaims?.metadata as { workspaceId?: string })?.workspaceId;
    if (!workspaceId) {
      return createErrorResponse(new Error('Workspace access forbidden'), 'Dismiss insight');
    }

    const { id: insightId } = await params;

    // Verify insight belongs to workspace
    const insight = await db.query.proactiveInsights.findFirst({
      where: and(
        eq(proactiveInsights.id, insightId),
        eq(proactiveInsights.workspaceId, workspaceId)
      ),
    });

    if (!insight) {
      return createErrorResponse(new Error('Insight not found'), 'Dismiss insight');
    }

    // Mark as dismissed
    await db
      .update(proactiveInsights)
      .set({ dismissedAt: new Date() })
      .where(eq(proactiveInsights.id, insightId));

    logger.info('[API] Insight dismissed', { insightId, workspaceId, userId });

    return NextResponse.json({
      success: true,
      message: 'Insight dismissed successfully',
    });

  } catch (error) {
    return createErrorResponse(error, 'Dismiss insight');
  }
}
