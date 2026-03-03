import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { generateFeedCards, generateGreeting } from '@/lib/home/card-engine';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';
import type { HomeFeedResponse } from '@/types/home-feed';

export async function GET(_request: NextRequest) {
  try {
    const { workspaceId, userId, user } = await getCurrentWorkspace();
    const userName =
      `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'there';

    const rateLimitResult = await rateLimit(`api:home:feed:${userId}`, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const cards = await generateFeedCards(workspaceId, userId, userName);
    const greeting = generateGreeting(userName);
    const isNewUser = cards.some((c) => c.category === 'onboarding');

    const response: HomeFeedResponse = { greeting, cards, isNewUser };

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      },
    });
  } catch (error) {
    logger.error('Home feed error', { error });
    return createErrorResponse(error, 'Home feed error');
  }
}
