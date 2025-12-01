import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  conversations,
  conversationMessages,
  conversationParticipants,
  contacts,
  prospects,
} from '@/db/schema';
import { eq, and, desc, asc, ilike, or, inArray, count, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// Validation schemas
const listQuerySchema = z.object({
  channel: z.enum(['all', 'email', 'sms', 'call', 'whatsapp', 'social', 'live_chat']).optional(),
  status: z.enum(['all', 'active', 'archived', 'closed', 'spam']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.enum(['lastMessageAt', 'createdAt', 'updatedAt']).default('lastMessageAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createConversationSchema = z.object({
  channel: z.enum(['email', 'sms', 'call', 'whatsapp', 'social', 'live_chat']),
  subject: z.string().optional(),
  // Participant info
  participantEmail: z.string().email().optional(),
  participantPhone: z.string().optional(),
  participantName: z.string().optional(),
  // Link to existing CRM entity
  contactId: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  // Initial message
  initialMessage: z.string().optional(),
});

/**
 * GET /api/communications
 * List all conversations for the workspace with filtering and pagination
 */
export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { searchParams } = new URL(request.url);

    // Parse and validate query params
    const query = listQuerySchema.parse({
      channel: searchParams.get('channel') || 'all',
      status: searchParams.get('status') || 'all',
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 50,
      sortBy: searchParams.get('sortBy') || 'lastMessageAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    // Build where conditions
    const conditions = [eq(conversations.workspaceId, workspaceId)];

    if (query.channel && query.channel !== 'all') {
      conditions.push(eq(conversations.channel, query.channel));
    }

    if (query.status && query.status !== 'all') {
      conditions.push(eq(conversations.status, query.status));
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(conversations.subject, `%${query.search}%`),
          ilike(conversations.snippet, `%${query.search}%`)
        )!
      );
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(conversations)
      .where(and(...conditions));

    const total = totalResult?.count || 0;

    // Fetch conversations with pagination
    const offset = (query.page - 1) * query.limit;
    const orderFn = query.sortOrder === 'desc' ? desc : asc;
    const orderColumn = conversations[query.sortBy];

    const conversationsList = await db.query.conversations.findMany({
      where: and(...conditions),
      orderBy: [orderFn(orderColumn)],
      limit: query.limit,
      offset,
    });

    // Fetch related data
    const conversationIds = conversationsList.map((c) => c.id);

    const [latestMessages, participantsList] = await Promise.all([
      conversationIds.length > 0
        ? db.query.conversationMessages.findMany({
            where: and(
              eq(conversationMessages.workspaceId, workspaceId),
              inArray(conversationMessages.conversationId, conversationIds)
            ),
            orderBy: [desc(conversationMessages.createdAt)],
          })
        : [],
      conversationIds.length > 0
        ? db.query.conversationParticipants.findMany({
            where: and(
              eq(conversationParticipants.workspaceId, workspaceId),
              inArray(conversationParticipants.conversationId, conversationIds)
            ),
          })
        : [],
    ]);

    // Build response
    const data = conversationsList.map((conv) => {
      const convMessages = latestMessages.filter(
        (m) => m.conversationId === conv.id
      );
      const latestMessage = convMessages.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0];
      const convParticipants = participantsList.filter(
        (p) => p.conversationId === conv.id
      );

      return {
        id: conv.id,
        channel: conv.channel,
        status: conv.status,
        subject: conv.subject || '',
        snippet: conv.snippet || '',
        isUnread: conv.isUnread,
        isStarred: conv.isStarred,
        isPinned: conv.isPinned,
        unreadCount: conv.unreadCount || 0,
        messageCount: conv.messageCount || 0,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        assignedTo: conv.assignedTo,
        labels: conv.labels || [],
        tags: conv.tags || [],
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              body: latestMessage.body,
              direction: latestMessage.direction,
              senderName: latestMessage.senderName || '',
              createdAt: latestMessage.createdAt,
            }
          : null,
        participants: convParticipants.map((p) => ({
          id: p.id,
          contactId: p.contactId,
          prospectId: p.prospectId,
          customerId: p.customerId,
          userId: p.userId,
          email: p.email || '',
          phone: p.phone || '',
          name: p.name || '',
        })),
      };
    });

    // Get channel counts
    const channelCounts = await db
      .select({
        channel: conversations.channel,
        count: count(),
      })
      .from(conversations)
      .where(eq(conversations.workspaceId, workspaceId))
      .groupBy(conversations.channel);

    return NextResponse.json({
      conversations: data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      channelCounts: channelCounts.reduce(
        (acc, { channel, count }) => {
          acc[channel] = count;
          return acc;
        },
        {} as Record<string, number>
      ),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('List communications error', error);
    return createErrorResponse(error, 'List communications error');
  }
}

/**
 * POST /api/communications
 * Create a new conversation
 */
export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createConversationSchema.parse(body);

    // Determine participant info
    let participantName = validated.participantName;
    let participantEmail = validated.participantEmail;
    let participantPhone = validated.participantPhone;

    // If linking to existing CRM entity, fetch their info
    if (validated.contactId) {
      const contact = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.id, validated.contactId),
          eq(contacts.workspaceId, workspaceId)
        ),
      });
      if (contact) {
        participantName = participantName || `${contact.firstName} ${contact.lastName}`.trim();
        participantEmail = participantEmail || contact.email;
        participantPhone = participantPhone || contact.phone || undefined;
      }
    } else if (validated.prospectId) {
      const prospect = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, validated.prospectId),
          eq(prospects.workspaceId, workspaceId)
        ),
      });
      if (prospect) {
        participantName = participantName || prospect.name;
        participantEmail = participantEmail || prospect.email;
        participantPhone = participantPhone || prospect.phone || undefined;
      }
    }

    // Create conversation
    const [conversation] = await db
      .insert(conversations)
      .values({
        workspaceId,
        channel: validated.channel,
        status: 'active',
        subject: validated.subject || `New ${validated.channel} conversation`,
        snippet: validated.initialMessage?.substring(0, 200) || '',
        isUnread: false,
        isStarred: false,
        isPinned: false,
        unreadCount: 0,
        messageCount: validated.initialMessage ? 1 : 0,
        lastMessageAt: new Date(),
        assignedTo: user.id,
        labels: [],
        tags: [],
      })
      .returning();

    // Create participant
    if (participantName || participantEmail || participantPhone) {
      await db.insert(conversationParticipants).values({
        workspaceId,
        conversationId: conversation.id,
        contactId: validated.contactId || null,
        prospectId: validated.prospectId || null,
        customerId: validated.customerId || null,
        name: participantName || 'Unknown',
        email: participantEmail || '',
        phone: participantPhone || '',
        isActive: true,
      });
    }

    // Create initial message if provided
    if (validated.initialMessage) {
      await db.insert(conversationMessages).values({
        workspaceId,
        conversationId: conversation.id,
        body: validated.initialMessage,
        direction: 'outbound',
        senderId: user.id,
        senderName:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.emailAddresses[0]?.emailAddress || 'User',
        senderEmail: user.emailAddresses[0]?.emailAddress || undefined,
        isFromCustomer: false,
        isRead: true,
      });
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        channel: conversation.channel,
        status: conversation.status,
        subject: conversation.subject,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Create communication error', error);
    return createErrorResponse(error, 'Create communication error');
  }
}


