import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, conversationMessages, conversationParticipants, workspacePhoneNumbers } from "@/db/schema";
import { eq, desc, count, and, inArray } from "drizzle-orm";
import ConversationsDashboard from "@/components/conversations/ConversationsDashboard";
import { logger } from "@/lib/logger";
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Fetch conversations and workspace phone numbers
    const [conversationsList, phoneNumbers] = await Promise.all([
      db.query.conversations.findMany({
        where: eq(conversations.workspaceId, workspaceId),
        orderBy: [desc(conversations.lastMessageAt)],
        limit: 100,
      }),
      db.query.workspacePhoneNumbers.findMany({
        where: and(
          eq(workspacePhoneNumbers.workspaceId, workspaceId),
          eq(workspacePhoneNumbers.status, 'active')
        ),
        orderBy: [desc(workspacePhoneNumbers.numberType)], // Primary first
      }),
    ]);

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

    // Calculate average response time (in minutes)
    const responseDeltas: number[] = [];
    for (const conv of conversationsList) {
      const convMessages = latestMessages
        .filter(m => m.conversationId === conv.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      const inbound = convMessages.filter(m => m.direction === 'inbound');
      const outbound = convMessages.filter(m => m.direction === 'outbound');
      
      // For each inbound message, find the next outbound and calculate delta
      for (const inMsg of inbound) {
        const nextOut = outbound.find(o => o.createdAt.getTime() > inMsg.createdAt.getTime());
        if (nextOut) {
          const deltaMinutes = (nextOut.createdAt.getTime() - inMsg.createdAt.getTime()) / (1000 * 60);
          responseDeltas.push(deltaMinutes);
        }
      }
    }

    const avgResponseTime = responseDeltas.length > 0
      ? Math.round(responseDeltas.reduce((a, b) => a + b, 0) / responseDeltas.length)
      : 0;

    const stats = {
      totalConversations: totalStats[0]?.count || 0,
      unreadMessages: unreadStats[0]?.count || 0,
      activeChannels: activeChannelsStats.length || 0,
      avgResponseTime,
    };

    return (
      <ErrorBoundary>
        <ConversationsDashboard
          phoneNumbers={phoneNumbers as Array<{ id: string; phoneNumber: string; friendlyName: string | null; numberType: 'primary' | 'sales' | 'support' | 'custom'; status: string }>}
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
          phoneNumbers={[]}
          initialConversations={[]}
          stats={{ totalConversations: 0, unreadMessages: 0, activeChannels: 0, avgResponseTime: 0 }}
        />
      </ErrorBoundary>
    );
  }
}
