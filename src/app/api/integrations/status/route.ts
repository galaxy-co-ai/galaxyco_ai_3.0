import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { integrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { isTwilioConfigured, isFlexConfigured, verifyCredentials } from '@/lib/twilio';

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const workspaceIntegrations = await db.query.integrations.findMany({
      where: eq(integrations.workspaceId, workspaceId),
    });

    // Check Twilio configuration status
    const twilioConfigured = isTwilioConfigured();
    const twilioFlexConfigured = isFlexConfigured();
    let twilioVerified = false;
    
    if (twilioConfigured) {
      // Verify credentials are valid
      twilioVerified = await verifyCredentials();
    }

    // Map to show connection status
    const integrationStatus = {
      google: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'google' && i.status === 'active'),
      microsoft: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'microsoft' && i.status === 'active'),
      slack: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'slack' && i.status === 'active'),
      salesforce: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'salesforce' && i.status === 'active'),
      hubspot: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'hubspot' && i.status === 'active'),
      twitter: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'twitter' && i.status === 'active'),
      twilio: twilioConfigured && twilioVerified,
    };

    return NextResponse.json({
      integrations: workspaceIntegrations.map((i: typeof workspaceIntegrations[0]) => ({
        id: i.id,
        provider: i.provider,
        status: i.status,
        connectedAt: i.createdAt, // Using createdAt as connectedAt
        lastSyncAt: i.lastSyncAt,
      })),
      status: integrationStatus,
      twilio: {
        configured: twilioConfigured,
        verified: twilioVerified,
        flexEnabled: twilioFlexConfigured,
        phoneNumber: twilioConfigured ? process.env.TWILIO_PHONE_NUMBER : null,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Get integrations error');
  }
}






