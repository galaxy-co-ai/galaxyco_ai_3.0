import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentWorkspace } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Validation schema for checkout request
const CheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  planName: z.string().optional(),
});

/**
 * Create a Stripe Checkout Session for subscription
 * POST /api/stripe/checkout
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId, user } = await getCurrentWorkspace();
    
    if (!userId || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = CheckoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { priceId, planName } = validation.data;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string | undefined;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: {
        userId: userId,
        workspaceId: workspaceId || '',
        planName: planName || '',
      },
      subscription_data: {
        metadata: {
          userId: userId,
          workspaceId: workspaceId || '',
        },
      },
    });

    logger.info('Stripe checkout session created', { 
      sessionId: session.id, 
      userId,
      planName 
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });
  } catch (error) {
    logger.error('Stripe checkout error', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
