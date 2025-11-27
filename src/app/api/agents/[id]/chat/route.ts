import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, aiConversations, aiMessages } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
  conversationId: z.string().uuid().optional(),
});

// GET: Fetch conversation history for an agent
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: agentId } = await params;

    // Verify agent exists and belongs to workspace
    const agent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, agentId),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Find or get the agent-specific conversation
    // We use a convention: conversation title starts with "Agent Chat:" + agent id
    const conversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, user.id)
      ),
      orderBy: [desc(aiConversations.lastMessageAt)],
    });

    // Find conversation for this specific agent (using title or context.agentId)
    const agentConversation = conversations.find(c => 
      c.title?.startsWith(`Agent Chat: ${agent.name}`) || 
      (c.context as any)?.agentId === agentId
    );

    if (!agentConversation) {
      return NextResponse.json({
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          status: agent.status,
        },
        conversation: null,
        messages: [],
      });
    }

    // Get messages for this conversation
    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, agentConversation.id),
      orderBy: [asc(aiMessages.createdAt)],
    });

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
      },
      conversation: {
        id: agentConversation.id,
        title: agentConversation.title,
        messageCount: agentConversation.messageCount,
      },
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Get agent chat error');
  }
}

// POST: Send a message to an agent
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: agentId } = await params;

    // Rate limit
    const rateLimitResult = await rateLimit(
      `agent:chat:${user.id}`,
      30, // 30 requests
      60  // per minute
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }

    // Verify agent exists and belongs to workspace
    const agent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, agentId),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = chatSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { message, conversationId } = validationResult.data;

    // Get or create conversation for this agent
    let conversation;
    
    if (conversationId) {
      conversation = await db.query.aiConversations.findFirst({
        where: and(
          eq(aiConversations.id, conversationId),
          eq(aiConversations.workspaceId, workspaceId),
          eq(aiConversations.userId, user.id)
        ),
      });
    }

    if (!conversation) {
      // Create new conversation for this agent
      const [newConv] = await db
        .insert(aiConversations)
        .values({
          workspaceId,
          userId: user.id,
          title: `Agent Chat: ${agent.name}`,
          lastMessageAt: new Date(),
          messageCount: 0,
          context: { 
            page: `/agents/${agent.id}`,
            selectedItems: { agentId: agent.id },
          },
        })
        .returning();

      conversation = newConv;
    }

    // Save user message
    await db
      .insert(aiMessages)
      .values({
        conversationId: conversation.id,
        role: 'user',
        content: message,
      });

    // Get conversation history for context
    const history = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversation.id),
      orderBy: [asc(aiMessages.createdAt)],
      limit: 20,
    });

    // Build agent-specific system prompt
    const agentConfig = agent.config as {
      systemPrompt?: string;
      tools?: string[];
      knowledgeBase?: { enabled: boolean };
    } | null;

    let systemPrompt = agentConfig?.systemPrompt || 
      `You are ${agent.name}, an AI assistant. ${agent.description || ''}`;
    
    systemPrompt += `\n\nYou are currently in a chat interface where users can interact with you directly. Be helpful, concise, and conversational.`;

    // Determine agent capabilities based on type (matching agentTypeEnum)
    const agentType = agent.type;
    if (agentType === 'scope') {
      systemPrompt += `\n\nYou specialize in project scoping, requirements gathering, and planning.`;
    } else if (agentType === 'call') {
      systemPrompt += `\n\nYou specialize in call management, scheduling, and follow-ups.`;
    } else if (agentType === 'note') {
      systemPrompt += `\n\nYou specialize in note-taking, summarization, and documentation.`;
    } else if (agentType === 'task') {
      systemPrompt += `\n\nYou specialize in task management, prioritization, and workflow automation.`;
    } else if (agentType === 'roadmap') {
      systemPrompt += `\n\nYou specialize in roadmap planning, milestone tracking, and project timelines.`;
    } else if (agentType === 'content') {
      systemPrompt += `\n\nYou specialize in content creation, writing, and marketing materials.`;
    } else if (agentType === 'browser') {
      systemPrompt += `\n\nYou specialize in web browsing, research, and data extraction.`;
    } else if (agentType === 'knowledge') {
      systemPrompt += `\n\nYou specialize in knowledge management, documentation, and information retrieval.`;
    } else if (agentType === 'code') {
      systemPrompt += `\n\nYou specialize in code review, development assistance, and technical documentation.`;
    } else if (agentType === 'data') {
      systemPrompt += `\n\nYou specialize in data analysis, reporting, and generating insights.`;
    } else if (agentType === 'security') {
      systemPrompt += `\n\nYou specialize in security analysis, compliance, and risk assessment.`;
    }

    // Call OpenAI
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 
      "I apologize, but I couldn't generate a response. Please try again.";

    // Save assistant message
    const [aiMessage] = await db
      .insert(aiMessages)
      .values({
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage,
      })
      .returning();

    // Update conversation
    await db
      .update(aiConversations)
      .set({
        lastMessageAt: new Date(),
        messageCount: conversation.messageCount + 2,
      })
      .where(eq(aiConversations.id, conversation.id));

    const duration = Date.now() - startTime;
    logger.info('[Agent Chat] Success', { 
      duration: `${duration}ms`, 
      agentId, 
      conversationId: conversation.id 
    });

    return NextResponse.json({
      conversationId: conversation.id,
      message: {
        id: aiMessage.id,
        role: 'assistant',
        content: assistantMessage,
        timestamp: aiMessage.createdAt,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Agent chat error');
  }
}

// DELETE: Clear conversation history for an agent
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: agentId } = await params;

    // Verify agent exists
    const agent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, agentId),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Find conversation for this agent
    const conversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, user.id)
      ),
    });

    const agentConversation = conversations.find(c => 
      c.title?.startsWith(`Agent Chat: ${agent.name}`) || 
      c.context?.selectedItems?.agentId === agentId
    );

    if (agentConversation) {
      // Delete messages
      await db
        .delete(aiMessages)
        .where(eq(aiMessages.conversationId, agentConversation.id));

      // Delete conversation
      await db
        .delete(aiConversations)
        .where(eq(aiConversations.id, agentConversation.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete agent chat error');
  }
}

