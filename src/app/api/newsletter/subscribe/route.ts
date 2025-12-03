import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { newsletterSubscribers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema
const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

/**
 * POST - Subscribe to newsletter
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    const body = await request.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if already subscribed
    const existing = await db.query.newsletterSubscribers.findFirst({
      where: eq(newsletterSubscribers.email, email),
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { error: 'This email is already subscribed' },
          { status: 409 }
        );
      } else {
        // Reactivate subscription
        await db
          .update(newsletterSubscribers)
          .set({
            isActive: true,
            unsubscribedAt: null,
            userId: userId || existing.userId,
          })
          .where(eq(newsletterSubscribers.id, existing.id));

        return NextResponse.json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
        });
      }
    }

    // Create new subscription
    await db.insert(newsletterSubscribers).values({
      email,
      userId: userId || null,
      isVerified: !!userId, // Auto-verify if logged in
      isActive: true,
    });

    logger.info('Newsletter subscription created', { email, userId });

    return NextResponse.json({
      success: true,
      message: userId 
        ? 'You\'re subscribed! Look out for our updates.' 
        : 'Almost there! Please check your email to confirm your subscription.',
    });
  } catch (error) {
    logger.error('Failed to subscribe to newsletter', { error });
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Unsubscribe from newsletter
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const subscriber = await db.query.newsletterSubscribers.findFirst({
      where: eq(newsletterSubscribers.email, email),
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    await db
      .update(newsletterSubscribers)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.id, subscriber.id));

    logger.info('Newsletter unsubscribed', { email });

    return NextResponse.json({
      success: true,
      message: 'You have been unsubscribed from our newsletter.',
    });
  } catch (error) {
    logger.error('Failed to unsubscribe from newsletter', { error });
    return NextResponse.json(
      { error: 'Failed to unsubscribe. Please try again.' },
      { status: 500 }
    );
  }
}
