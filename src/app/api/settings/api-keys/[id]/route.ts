import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaceApiKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

// ============================================================================
// DELETE - Delete API Key
// ============================================================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limiting
    const rateLimitResult = await rateLimit(`settings:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const { id: apiKeyId } = await params;

    // Get the API key
    const apiKey = await db.query.workspaceApiKeys.findFirst({
      where: and(
        eq(workspaceApiKeys.id, apiKeyId),
        eq(workspaceApiKeys.workspaceId, workspaceId)
      ),
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Delete the API key
    await db
      .delete(workspaceApiKeys)
      .where(eq(workspaceApiKeys.id, apiKeyId));

    logger.info('API key deleted', { apiKeyId, workspaceId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete API key error');
  }
}

































































