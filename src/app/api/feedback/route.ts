import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { platformFeedback } from '@/db/schema';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema
const feedbackSchema = z.object({
  type: z.enum(['bug', 'suggestion', 'general', 'feature_request']),
  sentiment: z.enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive']).nullable().optional(),
  title: z.string().max(200).optional(),
  content: z.string().max(2000).optional(),
  pageUrl: z.string(),
  featureArea: z.string().optional(),
  screenshotUrl: z.string().url().optional(),
});

/**
 * POST - Submit feedback
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Please sign in to submit feedback' },
        { status: 401 }
      );
    }

    // Get user email
    const user = await currentUser();
    const userEmail = user?.emailAddresses.find(
      e => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    const body = await request.json();
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get browser info from user agent
    const userAgent = request.headers.get('user-agent') || '';
    const browserInfo = parseBrowserInfo(userAgent);

    // Create feedback entry
    const [feedback] = await db
      .insert(platformFeedback)
      .values({
        userId,
        userEmail,
        pageUrl: data.pageUrl,
        featureArea: data.featureArea || null,
        type: data.type,
        sentiment: data.sentiment || null,
        title: data.title || null,
        content: data.content || null,
        screenshotUrl: data.screenshotUrl || null,
        metadata: {
          browser: browserInfo.browser,
          os: browserInfo.os,
          additionalContext: { userAgent },
        },
        status: 'new',
      })
      .returning();

    logger.info('Feedback submitted', {
      feedbackId: feedback.id,
      type: data.type,
      featureArea: data.featureArea,
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
    });
  } catch (error) {
    logger.error('Failed to submit feedback', { error });
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// Parse browser info from user agent
function parseBrowserInfo(userAgent: string): { browser: string; os: string } {
  let browser = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  }

  // OS detection
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  return { browser, os };
}
