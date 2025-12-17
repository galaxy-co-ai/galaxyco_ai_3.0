import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { oauthProviders } from '@/lib/oauth';

/**
 * OAuth Debug Endpoint - Admin only
 * GET /api/admin/oauth-debug
 * 
 * Returns OAuth configuration details (without secrets) to help troubleshoot OAuth issues
 */
export async function GET() {
  try {
    // Verify admin access
    await getCurrentUser();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const diagnostics = {
      appUrl,
      providers: {
        google: {
          configured: !!(oauthProviders.google.clientId && oauthProviders.google.clientSecret),
          clientIdSet: !!oauthProviders.google.clientId,
          clientSecretSet: !!oauthProviders.google.clientSecret,
          clientIdPrefix: oauthProviders.google.clientId?.slice(0, 20) + '...',
          authUrl: oauthProviders.google.authUrl,
          redirectUri: `${appUrl}/api/auth/oauth/google/callback`,
          scopes: oauthProviders.google.scopes,
        },
        microsoft: {
          configured: !!(oauthProviders.microsoft.clientId && oauthProviders.microsoft.clientSecret),
          clientIdSet: !!oauthProviders.microsoft.clientId,
          clientSecretSet: !!oauthProviders.microsoft.clientSecret,
          clientIdPrefix: oauthProviders.microsoft.clientId?.slice(0, 20) + '...',
          authUrl: oauthProviders.microsoft.authUrl,
          redirectUri: `${appUrl}/api/auth/oauth/microsoft/callback`,
          scopes: oauthProviders.microsoft.scopes,
        },
        quickbooks: {
          configured: !!(oauthProviders.quickbooks.clientId && oauthProviders.quickbooks.clientSecret),
          clientIdSet: !!oauthProviders.quickbooks.clientId,
          clientSecretSet: !!oauthProviders.quickbooks.clientSecret,
          redirectUri: `${appUrl}/api/auth/oauth/quickbooks/callback`,
        },
        shopify: {
          configured: !!(oauthProviders.shopify.clientId && oauthProviders.shopify.clientSecret),
          clientIdSet: !!oauthProviders.shopify.clientId,
          clientSecretSet: !!oauthProviders.shopify.clientSecret,
          redirectUri: `${appUrl}/api/auth/oauth/shopify/callback`,
        },
        twitter: {
          configured: !!(oauthProviders.twitter.clientId && oauthProviders.twitter.clientSecret),
          clientIdSet: !!oauthProviders.twitter.clientId,
          clientSecretSet: !!oauthProviders.twitter.clientSecret,
          redirectUri: `${appUrl}/api/auth/oauth/twitter/callback`,
        },
      },
      instructions: {
        google: {
          step1: 'Go to Google Cloud Console: https://console.cloud.google.com/',
          step2: 'Create or select a project',
          step3: 'Enable Gmail API and Google Calendar API',
          step4: 'Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"',
          step5: 'Application type: "Web application"',
          step6: `Add this exact redirect URI: ${appUrl}/api/auth/oauth/google/callback`,
          step7: 'Copy Client ID and Client Secret to your .env.local file',
          step8: 'IMPORTANT: The redirect URI in Google Console MUST exactly match the one shown above',
          commonIssues: [
            'Redirect URI mismatch (most common)',
            'OAuth consent screen not configured',
            'Missing required APIs (Gmail, Calendar)',
            'Using wrong App URL (localhost vs production)',
          ],
        },
      },
    };

    return NextResponse.json(diagnostics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized or server error' },
      { status: 401 }
    );
  }
}
