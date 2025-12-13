/**
 * Email Sync Service
 * 
 * Syncs emails from Google (Gmail) and Microsoft (Outlook) for CRM contact timeline.
 * Matches emails to contacts by email address and stores in conversations.
 */

import { db } from '@/lib/db';
import { integrations, oauthTokens, contacts, conversations, conversationMessages, conversationParticipants } from '@/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { refreshAccessToken, OAuthProvider } from '@/lib/oauth';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  body: string;
  htmlBody?: string;
  from: { email: string; name?: string };
  to: { email: string; name?: string }[];
  cc?: { email: string; name?: string }[];
  date: Date;
  isRead: boolean;
  attachments?: Array<{
    name: string;
    size: number;
    mimeType: string;
  }>;
}

export interface EmailSyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  provider: 'google' | 'microsoft';
}

// ============================================================================
// ACCESS TOKEN MANAGEMENT
// ============================================================================

/**
 * Get access token for a provider integration
 */
async function getAccessToken(
  workspaceId: string,
  provider: OAuthProvider
): Promise<string | null> {
  try {
    // Find the integration for this workspace
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.workspaceId, workspaceId),
        eq(integrations.provider, provider),
        eq(integrations.status, 'active')
      ),
    });

    if (!integration) {
      return null;
    }

    // Get the OAuth token for this integration
    const token = await db.query.oauthTokens.findFirst({
      where: eq(oauthTokens.integrationId, integration.id),
    });

    if (!token || !token.accessToken) {
      return null;
    }

    // Check if token needs refresh
    const tokenExpiry = token.expiresAt;
    if (tokenExpiry && new Date(tokenExpiry) <= new Date()) {
      if (token.refreshToken) {
        const refreshed = await refreshAccessToken(provider, token.refreshToken);
        if (refreshed) {
          // Update stored tokens
          await db
            .update(oauthTokens)
            .set({
              accessToken: refreshed.accessToken,
              expiresAt: refreshed.expiresIn
                ? new Date(Date.now() + refreshed.expiresIn * 1000)
                : null,
              updatedAt: new Date(),
            })
            .where(eq(oauthTokens.id, token.id));

          return refreshed.accessToken;
        }
      }
      return null;
    }

    return token.accessToken;
  } catch (error) {
    logger.error(`[Email Sync] Failed to get ${provider} access token`, error);
    return null;
  }
}

// ============================================================================
// GMAIL API
// ============================================================================

/**
 * Fetch emails from Gmail
 */
async function fetchGmailMessages(
  accessToken: string,
  options: {
    maxResults?: number;
    query?: string;
    afterDate?: Date;
  }
): Promise<EmailMessage[]> {
  const { maxResults = 50, query, afterDate } = options;

  // Build search query
  let searchQuery = query || '';
  if (afterDate) {
    const dateStr = afterDate.toISOString().split('T')[0].replace(/-/g, '/');
    searchQuery += ` after:${dateStr}`;
  }

  // Get message list
  const listParams = new URLSearchParams({
    maxResults: String(maxResults),
  });
  if (searchQuery.trim()) {
    listParams.set('q', searchQuery.trim());
  }

  const listResponse = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?${listParams}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!listResponse.ok) {
    throw new Error(`Gmail list error: ${await listResponse.text()}`);
  }

  const listData = await listResponse.json();
  const messageIds = listData.messages || [];

  // Fetch full message details in batches
  const messages: EmailMessage[] = [];
  
  for (const { id } of messageIds.slice(0, maxResults)) {
    try {
      const msgResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!msgResponse.ok) continue;

      const msgData = await msgResponse.json();
      const headers = msgData.payload?.headers || [];

      const getHeader = (name: string) => 
        headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value;

      // Parse body
      let body = '';
      let htmlBody = '';
      
      const parseBody = (part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }) => {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString();
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          htmlBody = Buffer.from(part.body.data, 'base64').toString();
        } else if (part.parts) {
          (part.parts as typeof part[]).forEach(parseBody);
        }
      };
      
      if (msgData.payload?.body?.data) {
        body = Buffer.from(msgData.payload.body.data, 'base64').toString();
      } else if (msgData.payload?.parts) {
        msgData.payload.parts.forEach(parseBody);
      }

      // Parse from
      const fromHeader = getHeader('From') || '';
      const fromMatch = fromHeader.match(/^(?:(.+?)\s*)?<(.+?)>$/) || [null, null, fromHeader];
      const from = {
        name: fromMatch[1]?.replace(/"/g, '') || undefined,
        email: fromMatch[2] || fromHeader,
      };

      // Parse to
      const toHeader = getHeader('To') || '';
      const to = toHeader.split(',').map((addr: string) => {
        const match = addr.trim().match(/^(?:(.+?)\s*)?<(.+?)>$/) || [null, null, addr.trim()];
        return {
          name: match[1]?.replace(/"/g, '') || undefined,
          email: match[2] || addr.trim(),
        };
      });

      messages.push({
        id: msgData.id,
        threadId: msgData.threadId,
        subject: getHeader('Subject') || '(No subject)',
        snippet: msgData.snippet || '',
        body,
        htmlBody,
        from,
        to,
        date: new Date(parseInt(msgData.internalDate)),
        isRead: !msgData.labelIds?.includes('UNREAD'),
      });
    } catch (error) {
      logger.error('[Gmail] Failed to fetch message', { id, error });
    }
  }

  return messages;
}

// ============================================================================
// MICROSOFT GRAPH API
// ============================================================================

/**
 * Fetch emails from Microsoft (Outlook)
 */
async function fetchOutlookMessages(
  accessToken: string,
  options: {
    maxResults?: number;
    afterDate?: Date;
  }
): Promise<EmailMessage[]> {
  const { maxResults = 50, afterDate } = options;

  // Build OData filter
  let filter = '';
  if (afterDate) {
    filter = `receivedDateTime ge ${afterDate.toISOString()}`;
  }

  const params = new URLSearchParams({
    $top: String(maxResults),
    $orderby: 'receivedDateTime desc',
    $select: 'id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,receivedDateTime,isRead,hasAttachments',
  });
  if (filter) {
    params.set('$filter', filter);
  }

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Outlook API error: ${await response.text()}`);
  }

  const data = await response.json();

  return (data.value || []).map((msg: {
    id: string;
    conversationId: string;
    subject?: string;
    bodyPreview?: string;
    body?: { content?: string; contentType?: string };
    from?: { emailAddress?: { address?: string; name?: string } };
    toRecipients?: Array<{ emailAddress?: { address?: string; name?: string } }>;
    ccRecipients?: Array<{ emailAddress?: { address?: string; name?: string } }>;
    receivedDateTime?: string;
    isRead?: boolean;
  }) => ({
    id: msg.id,
    threadId: msg.conversationId,
    subject: msg.subject || '(No subject)',
    snippet: msg.bodyPreview || '',
    body: msg.body?.contentType === 'text' ? msg.body.content || '' : '',
    htmlBody: msg.body?.contentType === 'html' ? msg.body.content : undefined,
    from: {
      email: msg.from?.emailAddress?.address || '',
      name: msg.from?.emailAddress?.name,
    },
    to: (msg.toRecipients || []).map((r: { emailAddress?: { address?: string; name?: string } }) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    cc: (msg.ccRecipients || []).map((r: { emailAddress?: { address?: string; name?: string } }) => ({
      email: r.emailAddress?.address || '',
      name: r.emailAddress?.name,
    })),
    date: new Date(msg.receivedDateTime || Date.now()),
    isRead: msg.isRead || false,
  }));
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync emails from connected providers and match to CRM contacts
 */
export async function syncEmails(
  workspaceId: string,
  options: {
    provider?: 'google' | 'microsoft';
    maxResults?: number;
    afterDate?: Date;
    contactEmail?: string; // Optional: sync only emails for a specific contact
  } = {}
): Promise<EmailSyncResult[]> {
  const results: EmailSyncResult[] = [];
  const providers = options.provider 
    ? [options.provider] 
    : ['google', 'microsoft'] as const;

  for (const provider of providers) {
    const accessToken = await getAccessToken(workspaceId, provider);
    
    if (!accessToken) {
      continue; // Skip if not connected
    }

    const result: EmailSyncResult = {
      success: true,
      synced: 0,
      errors: [],
      provider,
    };

    try {
      // Fetch emails
      let emails: EmailMessage[];
      if (provider === 'google') {
        emails = await fetchGmailMessages(accessToken, {
          maxResults: options.maxResults,
          afterDate: options.afterDate,
          query: options.contactEmail ? `from:${options.contactEmail} OR to:${options.contactEmail}` : undefined,
        });
      } else {
        emails = await fetchOutlookMessages(accessToken, {
          maxResults: options.maxResults,
          afterDate: options.afterDate,
        });
      }

      // Get all contact emails for matching
      const workspaceContacts = await db.query.contacts.findMany({
        where: eq(contacts.workspaceId, workspaceId),
        columns: { id: true, email: true },
      });
      
      const contactEmailMap = new Map(
        workspaceContacts.map(c => [c.email.toLowerCase(), c.id])
      );

      // Process each email
      for (const email of emails) {
        try {
          // Find matching contact
          const allAddresses = [
            email.from.email,
            ...email.to.map(t => t.email),
            ...(email.cc || []).map(c => c.email),
          ].map(e => e.toLowerCase());

          const matchedContactId = allAddresses.find(addr => contactEmailMap.has(addr));
          
          if (!matchedContactId && options.contactEmail) {
            continue; // Skip if filtering by contact and no match
          }

          const contactId = matchedContactId ? contactEmailMap.get(matchedContactId) : null;

          // Find or create conversation
          let conversation = await db.query.conversations.findFirst({
            where: and(
              eq(conversations.workspaceId, workspaceId),
              eq(conversations.externalId, email.threadId)
            ),
          });

          if (!conversation) {
            // Create new conversation
            const [newConv] = await db
              .insert(conversations)
              .values({
                workspaceId,
                channel: 'email',
                status: 'active',
                subject: email.subject,
                snippet: email.snippet,
                externalId: email.threadId,
                externalMetadata: { provider },
                isUnread: !email.isRead,
                messageCount: 1,
                lastMessageAt: email.date,
              })
              .returning();
            
            conversation = newConv;

            // Add participant
            if (contactId) {
              await db.insert(conversationParticipants).values({
                workspaceId,
                conversationId: conversation.id,
                contactId,
                email: email.from.email,
                name: email.from.name,
              });
            }
          }

          // Check if message already exists
          const existingMessage = await db.query.conversationMessages.findFirst({
            where: and(
              eq(conversationMessages.conversationId, conversation.id),
              eq(conversationMessages.externalId, email.id)
            ),
          });

          if (!existingMessage) {
            // Create message
            await db.insert(conversationMessages).values({
              workspaceId,
              conversationId: conversation.id,
              body: email.body || email.snippet,
              htmlBody: email.htmlBody,
              subject: email.subject,
              direction: contactId && email.from.email.toLowerCase() === workspaceContacts.find(c => c.id === contactId)?.email.toLowerCase()
                ? 'inbound'
                : 'outbound',
              isFromCustomer: true,
              senderEmail: email.from.email,
              senderName: email.from.name,
              recipientEmail: email.to[0]?.email,
              externalId: email.id,
              externalMetadata: { provider, threadId: email.threadId },
              isRead: email.isRead,
              createdAt: email.date,
            });

            // Update conversation
            await db
              .update(conversations)
              .set({
                messageCount: (conversation.messageCount || 0) + 1,
                lastMessageAt: email.date > (conversation.lastMessageAt || new Date(0)) 
                  ? email.date 
                  : conversation.lastMessageAt,
                snippet: email.snippet,
                isUnread: !email.isRead,
                updatedAt: new Date(),
              })
              .where(eq(conversations.id, conversation.id));

            result.synced++;
          }
        } catch (error) {
          result.errors.push(`Failed to sync email ${email.id}: ${error}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
      logger.error(`[Email Sync] ${provider} sync failed`, { workspaceId, error });
    }

    results.push(result);
  }

  return results;
}

/**
 * Get emails for a specific contact
 */
export async function getContactEmails(
  workspaceId: string,
  contactId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  emails: Array<{
    id: string;
    subject: string;
    snippet: string;
    from: string;
    date: Date;
    isRead: boolean;
    direction: 'inbound' | 'outbound';
  }>;
  total: number;
}> {
  const { limit = 20, offset = 0 } = options;

  // Get conversations involving this contact
  const contactParticipations = await db.query.conversationParticipants.findMany({
    where: and(
      eq(conversationParticipants.workspaceId, workspaceId),
      eq(conversationParticipants.contactId, contactId)
    ),
    columns: { conversationId: true },
  });

  const conversationIds = contactParticipations.map(p => p.conversationId);

  if (conversationIds.length === 0) {
    return { emails: [], total: 0 };
  }

  // Get messages from those conversations
  const messages = await db.query.conversationMessages.findMany({
    where: and(
      eq(conversationMessages.workspaceId, workspaceId),
      inArray(conversationMessages.conversationId, conversationIds)
    ),
    orderBy: (msg, { desc }) => [desc(msg.createdAt)],
    limit,
    offset,
  });

  // Get total count (simplified for now)
  const total = messages.length + offset + (messages.length === limit ? 10 : 0);

  return {
    emails: messages.map(m => ({
      id: m.id,
      subject: m.subject || '(No subject)',
      snippet: m.body?.substring(0, 100) || '',
      from: m.senderEmail || '',
      date: m.createdAt,
      isRead: m.isRead || false,
      direction: m.direction as 'inbound' | 'outbound',
    })),
    total,
  };
}

/**
 * Check if email sync is available for a workspace
 */
export async function isEmailSyncAvailable(
  workspaceId: string
): Promise<{ google: boolean; microsoft: boolean }> {
  const googleToken = await getAccessToken(workspaceId, 'google');
  const microsoftToken = await getAccessToken(workspaceId, 'microsoft');

  return {
    google: !!googleToken,
    microsoft: !!microsoftToken,
  };
}
