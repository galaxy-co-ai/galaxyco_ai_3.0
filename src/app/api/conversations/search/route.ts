import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, conversationMessages, conversationParticipants } from '@/db/schema';
import { eq, and, ilike, desc, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

const searchSchema = z.object({
  q: z.string().min(1).max(500),
  channel: z.enum(['email', 'sms', 'call', 'whatsapp', 'social', 'live_chat']).optional(),
  status: z.enum(['active', 'archived', 'closed', 'spam']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// GET - Search conversations by message content
export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const rateLimitResult = await rateLimit(`conversations:${user.id}`, 100, 3600);
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

    const url = new URL(request.url);
    
    // Parse query params
    const params = searchSchema.parse({
      q: url.searchParams.get('q') || '',
      channel: url.searchParams.get('channel') || undefined,
      status: url.searchParams.get('status') || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: url.searchParams.get('limit') || 20,
      offset: url.searchParams.get('offset') || 0,
    });

    const searchTerm = `%${params.q}%`;

    // Search in messages
    const matchingMessages = await db
      .select({
        conversationId: conversationMessages.conversationId,
        messageId: conversationMessages.id,
        body: conversationMessages.body,
        createdAt: conversationMessages.createdAt,
      })
      .from(conversationMessages)
      .where(
        and(
          eq(conversationMessages.workspaceId, workspaceId),
          ilike(conversationMessages.body, searchTerm)
        )
      )
      .orderBy(desc(conversationMessages.createdAt))
      .limit(100); // Get up to 100 matching messages

    // Get unique conversation IDs
    const conversationIds = [...new Set(matchingMessages.map(m => m.conversationId))];

    if (conversationIds.length === 0) {
      return NextResponse.json({
        conversations: [],
        total: 0,
        hasMore: false,
      });
    }

    // Build conversation filters
    const filters = [
      eq(conversations.workspaceId, workspaceId),
      inArray(conversations.id, conversationIds),
    ];

    if (params.channel) {
      filters.push(eq(conversations.channel, params.channel));
    }
    if (params.status) {
      filters.push(eq(conversations.status, params.status));
    }
    if (params.startDate) {
      filters.push(sql`${conversations.lastMessageAt} >= ${new Date(params.startDate)}`);
    }
    if (params.endDate) {
      filters.push(sql`${conversations.lastMessageAt} <= ${new Date(params.endDate)}`);
    }

    // Fetch matching conversations
    const matchingConversations = await db
      .select()
      .from(conversations)
      .where(and(...filters))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(params.limit)
      .offset(params.offset);

    // Get participants for each conversation
    const participantsList = conversationIds.length > 0
      ? await db.query.conversationParticipants.findMany({
          where: and(
            eq(conversationParticipants.workspaceId, workspaceId),
            inArray(conversationParticipants.conversationId, conversationIds)
          ),
        })
      : [];

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(and(...filters));

    // Build response with highlighted snippets
    const results = matchingConversations.map(conv => {
      const convMessages = matchingMessages.filter(m => m.conversationId === conv.id);
      const firstMatch = convMessages[0];
      const convParticipants = participantsList.filter(p => p.conversationId === conv.id);

      // Create highlighted snippet
      let snippet = conv.snippet || '';
      if (firstMatch) {
        const matchIndex = firstMatch.body.toLowerCase().indexOf(params.q.toLowerCase());
        if (matchIndex >= 0) {
          const start = Math.max(0, matchIndex - 30);
          const end = Math.min(firstMatch.body.length, matchIndex + params.q.length + 30);
          snippet = (start > 0 ? '...' : '') + 
            firstMatch.body.slice(start, end) + 
            (end < firstMatch.body.length ? '...' : '');
        }
      }

      return {
        id: conv.id,
        channel: conv.channel,
        status: conv.status,
        subject: conv.subject,
        snippet,
        matchCount: convMessages.length,
        isUnread: conv.isUnread,
        isStarred: conv.isStarred,
        isPinned: conv.isPinned,
        lastMessageAt: conv.lastMessageAt,
        participants: convParticipants.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
        })),
      };
    });

    logger.info('Conversation search', {
      workspaceId,
      query: params.q,
      resultsCount: results.length,
    });

    return NextResponse.json({
      conversations: results,
      total: countResult?.count || 0,
      hasMore: (params.offset + params.limit) < (countResult?.count || 0),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return createErrorResponse(error, 'Search conversations error');
  }
}
