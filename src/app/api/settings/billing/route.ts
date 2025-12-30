import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Plan configuration
const PLANS = {
  free: { name: 'Free', price: 0, aiCredits: 100, storage: 1, teamMembers: 1 },
  starter: { name: 'Starter', price: 19, aiCredits: 1000, storage: 5, teamMembers: 3 },
  professional: { name: 'Professional', price: 49, aiCredits: 10000, storage: 25, teamMembers: 10 },
  enterprise: { name: 'Enterprise', price: 199, aiCredits: 100000, storage: 100, teamMembers: 50 },
} as const;

/**
 * GET /api/settings/billing
 * Fetch billing info for current workspace
 */
export async function GET() {
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

    if (!workspaceId) {
      return createErrorResponse(new Error('Workspace not found'), 'Get billing info error');
    }

    // Get workspace subscription data
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace) {
      return createErrorResponse(new Error('Workspace not found'), 'Get billing info error');
    }

    const tier = workspace.subscriptionTier as keyof typeof PLANS;
    const plan = PLANS[tier] || PLANS.free;

    let subscription: Stripe.Subscription | null = null;
    let paymentMethod: Stripe.PaymentMethod | null = null;
    let currentPeriodEnd: Date | null = null;

    // Fetch real Stripe data if we have a subscription
    if (workspace.stripeSubscriptionId) {
      try {
        subscription = await stripe.subscriptions.retrieve(workspace.stripeSubscriptionId);
        // Access current_period_end from the subscription object
        const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
        currentPeriodEnd = new Date(periodEnd * 1000);

        // Get payment method
        if (subscription.default_payment_method) {
          const pmId = typeof subscription.default_payment_method === 'string' 
            ? subscription.default_payment_method 
            : subscription.default_payment_method.id;
          paymentMethod = await stripe.paymentMethods.retrieve(pmId);
        }
      } catch (err) {
        logger.warn('Failed to fetch Stripe subscription', { err, subscriptionId: workspace.stripeSubscriptionId });
      }
    }

    // TODO: Replace with real usage tracking
    const usage = {
      aiCredits: { used: 0, limit: plan.aiCredits },
      storage: { used: 0, limit: plan.storage },
      teamMembers: { used: 1, limit: plan.teamMembers },
    };

    return NextResponse.json({
      plan: {
        id: tier,
        name: plan.name,
        price: plan.price,
      },
      status: workspace.subscriptionStatus,
      currentPeriodEnd: currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: subscription ? (subscription as unknown as { cancel_at_period_end: boolean }).cancel_at_period_end : false,
      paymentMethod: paymentMethod?.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      } : null,
      usage,
      hasStripeCustomer: !!workspace.stripeCustomerId,
    });
  } catch (error) {
    return createErrorResponse(error, 'Get billing info error');
  }
}
