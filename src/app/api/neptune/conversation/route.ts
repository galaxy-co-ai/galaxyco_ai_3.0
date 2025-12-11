import { NextResponse } from "next/server";
import { getCurrentWorkspace, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiConversations, aiMessages } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createErrorResponse } from "@/lib/api-error-handler";
import { z } from "zod";

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const postSchema = z.object({
  existingConversationId: z.string().uuid().nullable().optional(),
});

// ============================================================================
// GET - Fetch existing Neptune conversation with messages
// ============================================================================

export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const currentUser = await getCurrentUser();

    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    // Find the conversation
    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, currentUser.id)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get messages (reduced from 100 to 30 for performance optimization)
    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversationId),
      orderBy: [asc(aiMessages.createdAt)],
      limit: 30, // Optimized: was 100, reduced to improve context gathering speed
    });

    return NextResponse.json({
      conversationId: conversation.id,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        attachments: msg.attachments,
        metadata: msg.metadata,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, "Failed to get Neptune conversation");
  }
}

// ============================================================================
// POST - Get or create primary Neptune conversation
// ============================================================================

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const currentUser = await getCurrentUser();

    const body = await request.json();
    const validationResult = postSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { existingConversationId } = validationResult.data;

    // If an existing conversation ID was provided, try to use it
    if (existingConversationId) {
      const existingConversation = await db.query.aiConversations.findFirst({
        where: and(
          eq(aiConversations.id, existingConversationId),
          eq(aiConversations.workspaceId, workspaceId),
          eq(aiConversations.userId, currentUser.id)
        ),
      });

      if (existingConversation) {
        // Get messages for this conversation (optimized limit)
        const messages = await db.query.aiMessages.findMany({
          where: eq(aiMessages.conversationId, existingConversationId),
          orderBy: [asc(aiMessages.createdAt)],
          limit: 30, // Optimized: was 100
        });

        logger.debug("[Neptune API] Returning existing conversation", {
          conversationId: existingConversationId,
          messageCount: messages.length,
        });

        return NextResponse.json({
          conversationId: existingConversation.id,
          isNew: false,
          messages: messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
            attachments: msg.attachments,
            metadata: msg.metadata,
          })),
        });
      }
    }

    // No valid existing conversation - find the most recent Neptune conversation
    // or create a new one
    const recentConversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, currentUser.id)
      ),
      orderBy: [desc(aiConversations.lastMessageAt)],
    });

    // If we have a recent conversation (within last 24 hours), use it
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (
      recentConversation &&
      recentConversation.lastMessageAt &&
      new Date(recentConversation.lastMessageAt) > oneDayAgo
    ) {
      const messages = await db.query.aiMessages.findMany({
        where: eq(aiMessages.conversationId, recentConversation.id),
        orderBy: [asc(aiMessages.createdAt)],
        limit: 30, // Optimized: was 100
      });

      logger.debug("[Neptune API] Returning recent conversation", {
        conversationId: recentConversation.id,
        messageCount: messages.length,
      });

      return NextResponse.json({
        conversationId: recentConversation.id,
        isNew: false,
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
          attachments: msg.attachments,
          metadata: msg.metadata,
        })),
      });
    }

    // Create a new Neptune conversation
    const [newConversation] = await db
      .insert(aiConversations)
      .values({
        workspaceId,
        userId: currentUser.id,
        title: "Neptune Assistant",
        lastMessageAt: new Date(),
        messageCount: 0,
        context: {
          page: "neptune_primary",
          timestamp: new Date().toISOString(),
        },
      })
      .returning();

    logger.debug("[Neptune API] Created new conversation", {
      conversationId: newConversation.id,
    });

    return NextResponse.json({
      conversationId: newConversation.id,
      isNew: true,
      messages: [],
    });
  } catch (error) {
    return createErrorResponse(
      error,
      "Failed to get/create Neptune conversation"
    );
  }
}
