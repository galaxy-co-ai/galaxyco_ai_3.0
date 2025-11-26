import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { integrations, oauthTokens } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { decryptApiKey } from '@/lib/encryption';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: integrationId } = await params;

    // Verify ownership
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.id, integrationId),
        eq(integrations.workspaceId, workspaceId)
      ),
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Get OAuth tokens before deletion for revocation
    const tokens = await db.query.oauthTokens.findFirst({
      where: eq(oauthTokens.integrationId, integrationId),
    });

    // Revoke OAuth tokens with provider before deleting integration
    if (tokens && integration.provider) {
      try {
        await revokeOAuthToken(integration.provider as 'google' | 'microsoft', tokens);
        logger.info('OAuth tokens revoked successfully', { integrationId, provider: integration.provider });
      } catch (revokeError) {
        // Log error but continue with deletion - tokens will be invalidated anyway
        logger.error('Failed to revoke OAuth tokens', revokeError, { integrationId });
      }
    }

    // Delete integration (this will cascade delete tokens via foreign key)
    await db
      .delete(integrations)
      .where(and(
        eq(integrations.id, integrationId),
        eq(integrations.workspaceId, workspaceId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete integration error');
  }
}

/**
 * Revoke OAuth tokens with the provider
 * Decrypts tokens and calls provider revocation endpoint
 */
async function revokeOAuthToken(
  provider: 'google' | 'microsoft',
  tokens: { accessToken: string; refreshToken: string | null }
): Promise<void> {
  try {
    // Decrypt access token (stored as "iv:authTag:encryptedKey")
    let decryptedAccessToken: string;
    try {
      decryptedAccessToken = decryptApiKey(tokens.accessToken);
    } catch (decryptError) {
      logger.warn('Failed to decrypt access token for revocation', { error: decryptError });
      // Continue anyway - token will be invalidated when integration is deleted
      return;
    }

    // Revoke token with provider
    if (provider === 'google') {
      const response = await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: decryptedAccessToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Google token revocation failed: ${response.status} ${errorText}`);
      }

      logger.info('Google OAuth token revoked successfully', { provider });
    } else if (provider === 'microsoft') {
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      if (!clientId) {
        logger.warn('MICROSOFT_CLIENT_ID not configured - skipping revocation');
        return;
      }

      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          token: decryptedAccessToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Microsoft token revocation failed: ${response.status} ${errorText}`);
      }

      logger.info('Microsoft OAuth token revoked successfully', { provider });
    }
  } catch (error) {
    // Don't throw - tokens will be invalidated when integration is deleted
    // Log error for monitoring but don't block deletion
    logger.error('OAuth token revocation error (non-blocking)', error, { provider });
  }
}

