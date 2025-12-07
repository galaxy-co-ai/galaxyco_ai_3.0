import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { users, workspaces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 * 
 * Handles subscription lifecycle events:
 * - checkout.session.completed - New subscription created
 * - customer.subscription.updated - Plan changed
 * - customer.subscription.deleted - Subscription cancelled
 * - invoice.payment_succeeded - Recurring payment successful
 * - invoice.payment_failed - Payment failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      logger.warn('Stripe webhook: Missing signature');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      logger.warn('Stripe webhook: STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Stripe webhook signature verification failed', { error: errorMessage });
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    logger.info('Stripe webhook received', { type: event.type, id: event.id });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        logger.info('Unhandled Stripe event type', { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout - activate subscription
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const workspaceId = session.metadata?.workspaceId;
  const planName = session.metadata?.planName;

  logger.info('Checkout completed', { userId, workspaceId, planName, customerId: session.customer });

  if (userId) {
    // Update user timestamp
    await db.update(users)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  if (workspaceId && planName) {
    // Map plan name to subscription tier
    const tierMap: Record<string, 'free' | 'starter' | 'professional' | 'enterprise'> = {
      'starter': 'starter',
      'pro': 'professional',
      'professional': 'professional',
      'enterprise': 'enterprise',
    };
    const tier = tierMap[planName.toLowerCase()] || 'free';

    // Update workspace subscription
    await db.update(workspaces)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));

    logger.info('Workspace subscription updated', { workspaceId, tier });
  }
}

/**
 * Handle subscription updates (plan changes, renewals)
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const workspaceId = subscription.metadata?.workspaceId;

  logger.info('Subscription updated', { 
    subscriptionId: subscription.id,
    status: subscription.status,
    userId,
    workspaceId
  });

  if (workspaceId) {
    // Update subscription status
    await db.update(workspaces)
      .set({
        subscriptionStatus: subscription.status,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata?.workspaceId;

  logger.info('Subscription cancelled', { 
    subscriptionId: subscription.id,
    workspaceId 
  });

  if (workspaceId) {
    // Downgrade to free plan
    await db.update(workspaces)
      .set({
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled',
        stripeSubscriptionId: null,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));

    logger.info('Workspace downgraded to free', { workspaceId });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info('Payment succeeded', { 
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
    customerId: invoice.customer
  });
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  logger.warn('Payment failed', { 
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    customerId: invoice.customer
  });
}
