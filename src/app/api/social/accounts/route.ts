/**
 * Social Media Accounts API
 * 
 * GET: List connected social media accounts
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { createErrorResponse } from '@/lib/api-error-handler';
import { getTwitterIntegration } from '@/lib/social/twitter';

export async function GET() {
  try {
    const workspace = await getCurrentWorkspace();
    if (!workspace) {
      return createErrorResponse(new Error('Workspace not found'), 'Get social accounts');
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
    return createErrorResponse(error, 'Get social accounts');
  }
}
