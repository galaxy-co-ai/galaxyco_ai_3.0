import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentWorkspace } from '@/lib/auth';
import { logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Create a Stripe Customer Portal session
 * POST /api/stripe/portal
 * 
 * Allows customers to manage their subscription:
 * - Update payment method
 * - View invoices
 * - Cancel subscription
 * - Change plan
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, user } = await getCurrentWorkspace();
    
    if (!userId || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Find customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 404 }
      );
    }

    const customerId = customers.data[0].id;

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/settings`,
    });

    logger.info('Stripe portal session created', { 
      customerId, 
      userId
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error('Stripe portal error', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
