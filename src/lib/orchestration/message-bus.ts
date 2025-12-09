/**
 * Agent Message Bus - Inter-Agent Communication
 *
 * Provides a message bus for agent-to-agent and agent-to-team communication.
 * Supports:
 * - Direct agent-to-agent messaging
 * - Team broadcasts
 * - Message threading
 * - Delivery tracking
 * - Priority-based queuing
 */

import { db } from '@/lib/db';
import { agentMessages, agentTeamMembers } from '@/db/schema';
import { eq, and, desc, or, isNull, gte, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type {
  AgentMessage,
  SendMessageInput,
  MessageFilters,
  AgentMessageType,
  MessagePriority,
  MessageStatus,
} from './types';

// ============================================================================
// MESSAGE BUS CLASS
// ============================================================================

export class AgentMessageBus {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // ==========================================================================
  // SEND MESSAGES
  // ==========================================================================

  /**
   * Send a message between agents or to a team
   */
  async send(input: SendMessageInput): Promise<string> {
    try {
      logger.info('[MessageBus] Sending message', {
        workspaceId: this.workspaceId,
        fromAgentId: input.fromAgentId,
        toAgentId: input.toAgentId,
        teamId: input.teamId,
        messageType: input.messageType,
      });

      // Generate thread ID for new threads
      const threadId = input.parentMessageId
        ? await this.getThreadId(input.parentMessageId)
        : crypto.randomUUID();

      const [message] = await db
        .insert(agentMessages)
        .values({
          workspaceId: this.workspaceId,
          fromAgentId: input.fromAgentId,
          toAgentId: input.toAgentId,
          teamId: input.teamId,
          messageType: input.messageType,
          content: input.content,
          parentMessageId: input.parentMessageId,
          threadId,
          status: 'pending',
        })
        .returning();

      // Mark as delivered if it's a direct message
      if (input.toAgentId) {
        await db
          .update(agentMessages)
          .set({
            status: 'delivered',
            deliveredAt: new Date(),
          })
          .where(eq(agentMessages.id, message.id));
      }

      return message.id;
    } catch (error) {
      logger.error('[MessageBus] Failed to send message', error);
      throw error;
    }
  }

  /**
   * Broadcast a message to all agents in a team
   */
  async broadcast(
    teamId: string,
    message: Omit<SendMessageInput, 'toAgentId'>
  ): Promise<string[]> {
    try {
      logger.info('[MessageBus] Broadcasting to team', {
        workspaceId: this.workspaceId,
        teamId,
        messageType: message.messageType,
      });

      // Get all team members
      const members = await db.query.agentTeamMembers.findMany({
        where: eq(agentTeamMembers.teamId, teamId),
      });

      if (members.length === 0) {
        logger.warn('[MessageBus] Team has no members', { teamId });
        return [];
      }

      // Generate shared thread ID for the broadcast
      const threadId = crypto.randomUUID();

      // Send message to each team member
      const messageIds: string[] = [];
      for (const member of members) {
        // Skip if message is from this agent
        if (member.agentId === message.fromAgentId) {
          continue;
        }

        const [msg] = await db
          .insert(agentMessages)
          .values({
            workspaceId: this.workspaceId,
            fromAgentId: message.fromAgentId,
            toAgentId: member.agentId,
            teamId,
            messageType: message.messageType,
            content: message.content,
            threadId,
            status: 'delivered',
            deliveredAt: new Date(),
          })
          .returning();

        messageIds.push(msg.id);
      }

      logger.info('[MessageBus] Broadcast complete', {
        teamId,
        recipientCount: messageIds.length,
      });

      return messageIds;
    } catch (error) {
      logger.error('[MessageBus] Failed to broadcast', error);
      throw error;
    }
  }

  // ==========================================================================
  // RECEIVE MESSAGES
  // ==========================================================================

  /**
   * Get pending messages for an agent
   */
  async getMessages(agentId: string, filters?: MessageFilters): Promise<AgentMessage[]> {
    try {
      const conditions = [
        eq(agentMessages.workspaceId, this.workspaceId),
        eq(agentMessages.toAgentId, agentId),
      ];

      if (filters?.messageType) {
        conditions.push(eq(agentMessages.messageType, filters.messageType));
      }

      if (filters?.status) {
        conditions.push(eq(agentMessages.status, filters.status));
      }

      if (filters?.teamId) {
        conditions.push(eq(agentMessages.teamId, filters.teamId));
      }

      if (filters?.fromAgentId) {
        conditions.push(eq(agentMessages.fromAgentId, filters.fromAgentId));
      }

      if (filters?.since) {
        conditions.push(gte(agentMessages.createdAt, filters.since));
      }

      const limit = filters?.limit || 50;

      const messages = await db.query.agentMessages.findMany({
        where: and(...conditions),
        orderBy: [desc(agentMessages.createdAt)],
        limit,
      });

      return messages.map((m) => this.transformMessage(m));
    } catch (error) {
      logger.error('[MessageBus] Failed to get messages', error);
      return [];
    }
  }

  /**
   * Get unread messages count for an agent
   */
  async getUnreadCount(agentId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentMessages)
        .where(
          and(
            eq(agentMessages.workspaceId, this.workspaceId),
            eq(agentMessages.toAgentId, agentId),
            or(
              eq(agentMessages.status, 'pending'),
              eq(agentMessages.status, 'delivered')
            )!
          )
        );

      return result[0]?.count || 0;
    } catch (error) {
      logger.error('[MessageBus] Failed to get unread count', error);
      return 0;
    }
  }

  /**
   * Get messages in a thread
   */
  async getThread(threadId: string): Promise<AgentMessage[]> {
    try {
      const messages = await db.query.agentMessages.findMany({
        where: and(
          eq(agentMessages.workspaceId, this.workspaceId),
          eq(agentMessages.threadId, threadId)
        ),
        orderBy: [agentMessages.createdAt],
      });

      return messages.map((m) => this.transformMessage(m));
    } catch (error) {
      logger.error('[MessageBus] Failed to get thread', error);
      return [];
    }
  }

  // ==========================================================================
  // MESSAGE STATUS UPDATES
  // ==========================================================================

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await db
        .update(agentMessages)
        .set({
          status: 'read',
          readAt: new Date(),
        })
        .where(
          and(
            eq(agentMessages.id, messageId),
            eq(agentMessages.workspaceId, this.workspaceId)
          )
        );
    } catch (error) {
      logger.error('[MessageBus] Failed to mark as read', error);
    }
  }

  /**
   * Mark a message as processed (acknowledged)
   */
  async acknowledge(messageId: string): Promise<void> {
    try {
      await db
        .update(agentMessages)
        .set({
          status: 'processed',
          processedAt: new Date(),
        })
        .where(
          and(
            eq(agentMessages.id, messageId),
            eq(agentMessages.workspaceId, this.workspaceId)
          )
        );

      logger.info('[MessageBus] Message acknowledged', { messageId });
    } catch (error) {
      logger.error('[MessageBus] Failed to acknowledge message', error);
    }
  }

  /**
   * Mark multiple messages as read
   */
  async markMultipleAsRead(messageIds: string[]): Promise<void> {
    try {
      if (messageIds.length === 0) return;

      for (const messageId of messageIds) {
        await this.markAsRead(messageId);
      }
    } catch (error) {
      logger.error('[MessageBus] Failed to mark multiple as read', error);
    }
  }

  // ==========================================================================
  // REPLY AND THREADING
  // ==========================================================================

  /**
   * Reply to a message
   */
  async reply(
    messageId: string,
    fromAgentId: string,
    content: {
      subject: string;
      body: string;
      data?: Record<string, unknown>;
      priority: MessagePriority;
    }
  ): Promise<string> {
    try {
      const originalMessage = await db.query.agentMessages.findFirst({
        where: and(
          eq(agentMessages.id, messageId),
          eq(agentMessages.workspaceId, this.workspaceId)
        ),
      });

      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      // Determine the reply recipient
      const toAgentId =
        originalMessage.fromAgentId === fromAgentId
          ? originalMessage.toAgentId
          : originalMessage.fromAgentId;

      return this.send({
        workspaceId: this.workspaceId,
        fromAgentId,
        toAgentId: toAgentId || undefined,
        teamId: originalMessage.teamId || undefined,
        messageType: 'result', // Replies are typically results
        content,
        parentMessageId: messageId,
      });
    } catch (error) {
      logger.error('[MessageBus] Failed to reply', error);
      throw error;
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get the thread ID for a message
   */
  private async getThreadId(messageId: string): Promise<string> {
    const message = await db.query.agentMessages.findFirst({
      where: eq(agentMessages.id, messageId),
    });

    if (message?.threadId) {
      return message.threadId;
    }

    // If no thread ID, use the message ID as the thread root
    return messageId;
  }

  /**
   * Transform database message to API type
   */
  private transformMessage(msg: typeof agentMessages.$inferSelect): AgentMessage {
    return {
      id: msg.id,
      workspaceId: msg.workspaceId,
      fromAgentId: msg.fromAgentId || undefined,
      toAgentId: msg.toAgentId || undefined,
      teamId: msg.teamId || undefined,
      messageType: msg.messageType as AgentMessageType,
      content: msg.content as AgentMessage['content'],
      parentMessageId: msg.parentMessageId || undefined,
      threadId: msg.threadId || undefined,
      status: msg.status as MessageStatus,
      createdAt: msg.createdAt,
      deliveredAt: msg.deliveredAt || undefined,
      readAt: msg.readAt || undefined,
      processedAt: msg.processedAt || undefined,
    };
  }
}

