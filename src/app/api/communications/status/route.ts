import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { getChannelStatus, CHANNEL_ENV_VARS } from '@/lib/communications';

/**
 * GET /api/communications/status
 * Returns the configuration status of all communication channels
 */
export async function GET() {
  try {
    // Verify user is authenticated
    await getCurrentWorkspace();

    const status = getChannelStatus();

    return NextResponse.json({
      channels: status,
      envVarsRequired: CHANNEL_ENV_VARS,
      webhooks: {
        twilio: {
          sms: '/api/webhooks/twilio?type=sms&workspace=YOUR_WORKSPACE_ID',
          whatsapp: '/api/webhooks/twilio?type=whatsapp&workspace=YOUR_WORKSPACE_ID',
          voice: '/api/webhooks/twilio?type=voice&workspace=YOUR_WORKSPACE_ID',
        },
        email: {
          sendgrid: '/api/webhooks/email?provider=sendgrid&workspace=YOUR_WORKSPACE_ID',
          postmark: '/api/webhooks/email?provider=postmark&workspace=YOUR_WORKSPACE_ID',
          resend: '/api/webhooks/email?provider=resend&workspace=YOUR_WORKSPACE_ID',
        },
      },
      setupGuide: {
        twilio: 'https://console.twilio.com - Get Account SID, Auth Token, and phone number',
        sendgrid: 'https://app.sendgrid.com - Create API key and configure Inbound Parse',
        postmark: 'https://postmarkapp.com - Get API key and set up inbound webhook',
        resend: 'https://resend.com - Create API key',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to get channel status' },
      { status: 500 }
    );
  }
}


