import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, conversationMessages, conversationParticipants } from "@/db/schema";
import { eq, desc, count, and, inArray } from "drizzle-orm";
import ConversationsDashboard from "@/components/conversations/ConversationsDashboard";
import { logger } from "@/lib/logger";
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Fetch conversations
    const conversationsList = await db.query.conversations.findMany({
      where: eq(conversations.workspaceId, workspaceId),
      orderBy: [desc(conversations.lastMessageAt)],
      limit: 100,
    });

    // Fetch latest messages and participants for each conversation
    const conversationIds = conversationsList.map(c => c.id);
    const [latestMessages, participantsList] = await Promise.all([
      conversationIds.length > 0
        ? db.query.conversationMessages.findMany({
            where: and(
              eq(conversationMessages.workspaceId, workspaceId),
              inArray(conversationMessages.conversationId, conversationIds)
            ),
            orderBy: [desc(conversationMessages.createdAt)],
            limit: 100, // Get recent messages, we'll filter per conversation
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

    // Get stats
    const [totalStats, unreadStats, activeChannelsStats] = await Promise.all([
      db
        .select({ count: count() })
        .from(conversations)
        .where(
          and(
            eq(conversations.workspaceId, workspaceId),
            eq(conversations.status, 'active')
          )
        ),
      db
        .select({ count: count() })
        .from(conversations)
        .where(
          and(
            eq(conversations.workspaceId, workspaceId),
            eq(conversations.isUnread, true)
          )
        ),
      db
        .select({ count: count() })
        .from(conversations)
        .where(
          and(
            eq(conversations.workspaceId, workspaceId),
            eq(conversations.status, 'active')
          )
        )
        .groupBy(conversations.channel),
    ]);

    const stats = {
      totalConversations: totalStats[0]?.count || 0,
      unreadMessages: unreadStats[0]?.count || 0,
      activeChannels: activeChannelsStats.length || 0,
      avgResponseTime: 0, // TODO: Calculate from message timestamps
    };

    return (
      <ErrorBoundary>
        <ConversationsDashboard
          initialConversations={conversationsList.map((conv) => {
            const convMessages = latestMessages.filter(m => m.conversationId === conv.id);
            const latestMessage = convMessages.sort((a, b) => 
              b.createdAt.getTime() - a.createdAt.getTime()
            )[0];
            const convParticipants = participantsList.filter(p => p.conversationId === conv.id);

            return {
              id: conv.id,
              channel: conv.channel,
              status: conv.status,
              subject: conv.subject || "",
              snippet: conv.snippet || "",
              isUnread: conv.isUnread ?? false,
              isStarred: conv.isStarred ?? false,
              isPinned: conv.isPinned ?? false,
              unreadCount: conv.unreadCount || 0,
              messageCount: conv.messageCount || 0,
              lastMessageAt: conv.lastMessageAt,
              createdAt: conv.createdAt,
              updatedAt: conv.updatedAt,
              assignedTo: conv.assignedTo,
              labels: conv.labels || [],
              tags: conv.tags || [],
              latestMessage: latestMessage ? {
                id: latestMessage.id,
                body: latestMessage.body,
                direction: latestMessage.direction as 'inbound' | 'outbound',
                senderName: latestMessage.senderName || "",
                createdAt: latestMessage.createdAt,
              } : null,
              participants: convParticipants.map((p) => ({
                id: p.id,
                contactId: p.contactId,
                prospectId: p.prospectId,
                customerId: p.customerId,
                userId: p.userId,
                email: p.email || "",
                phone: p.phone || "",
                name: p.name || "",
              })),
            };
          })}
          stats={stats}
        />
      </ErrorBoundary>
    );
  } catch (error) {
    logger.error("Conversations page error", error instanceof Error ? error.message : String(error));
    return (
      <ErrorBoundary>
        <ConversationsDashboard
          initialConversations={[]}
          stats={{ totalConversations: 0, unreadMessages: 0, activeChannels: 0, avgResponseTime: 0 }}
        />
      </ErrorBoundary>
    );
  }
}
