import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const config = {
      notifications: {
        emailDigest: true,
        slackAlerts: false,
        inAppNotifications: true,
        dailySummary: true,
      },
      behavior: {
        autoSuggest: true,
        proactiveInsights: true,
        learningEnabled: true,
        responseLength: 'balanced' as const,
      },
      privacy: {
        shareAnalytics: true,
        dataRetentionDays: 90,
        anonymizeData: false,
      },
      integrations: {
        connectedApps: 4,
        apiEnabled: true,
        webhooksEnabled: false,
      },
    };

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
