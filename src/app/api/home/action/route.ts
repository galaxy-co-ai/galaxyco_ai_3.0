import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { FeedActionRequestSchema } from '@/lib/validation/home-feed';
import { executeCardAction } from '@/lib/home/action-executor';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    const rateLimitResult = await rateLimit(`api:home:action:${userId}`, 30, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const validation = FeedActionRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const result = await executeCardAction(validation.data, workspaceId, userId);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Home action error', { error });
    return createErrorResponse(error, 'Home action error');
  }
}
