/**
 * Social Media Accounts API
 * 
 * GET: List connected social media accounts
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getTwitterIntegration } from '@/lib/social/twitter';

export async function GET() {
  try {
    const workspace = await getCurrentWorkspace();
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const accounts = [];

    // Check Twitter
    const twitter = await getTwitterIntegration(workspace.workspaceId);
    if (twitter) {
      accounts.push({
        platform: 'twitter',
        username: twitter.username,
        name: twitter.name,
        connected: true,
      });
    }

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    logger.error('Failed to get social media accounts', error);
    return NextResponse.json(
      { error: 'Failed to get accounts' },
      { status: 500 }
    );
  }
}
