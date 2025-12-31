import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlistSignups } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema
const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  source: z.string().optional().default('landing'),
  referredBy: z.string().email().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

/**
 * POST - Join the waitlist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = waitlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, source, referredBy, utmSource, utmMedium, utmCampaign } = validation.data;

    // Check if already on waitlist
    const existing = await db.query.waitlistSignups.findFirst({
      where: eq(waitlistSignups.email, email.toLowerCase()),
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'You\'re already on the waitlist!',
          position: existing.position,
        },
        { status: 409 }
      );
    }

    // Get next position in queue
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(waitlistSignups);

    const nextPosition = (countResult?.count ?? 0) + 1;

    // Collect metadata from request
    const metadata = {
      userAgent: request.headers.get('user-agent') || undefined,
      referrer: request.headers.get('referer') || undefined,
      utmSource,
      utmMedium,
      utmCampaign,
    };

    // Create waitlist signup
    const [signup] = await db.insert(waitlistSignups).values({
      email: email.toLowerCase(),
      source,
      referredBy: referredBy?.toLowerCase(),
      position: nextPosition,
      metadata,
    }).returning();

    logger.info('Waitlist signup created', {
      email: email.toLowerCase(),
      position: nextPosition,
      source,
    });

    return NextResponse.json({
      success: true,
      message: 'You\'re on the list! We\'ll notify you when Galaxy is ready.',
      position: nextPosition,
      id: signup.id,
    });
  } catch (error) {
    logger.error('Failed to join waitlist', { error });
    return NextResponse.json(
      { error: 'Failed to join waitlist. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get waitlist stats (for admin/display)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // If email provided, get position
    if (email) {
      const signup = await db.query.waitlistSignups.findFirst({
        where: eq(waitlistSignups.email, email.toLowerCase()),
      });

      if (!signup) {
        return NextResponse.json(
          { error: 'Email not found on waitlist' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        position: signup.position,
        createdAt: signup.createdAt,
      });
    }

    // Otherwise return total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(waitlistSignups);

    return NextResponse.json({
      totalSignups: countResult?.count ?? 0,
    });
  } catch (error) {
    logger.error('Failed to get waitlist stats', { error });
    return NextResponse.json(
      { error: 'Failed to get waitlist stats' },
      { status: 500 }
    );
  }
}
