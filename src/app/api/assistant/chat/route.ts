import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiConversations, aiMessages } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    workspace: z.string().optional(),
    feature: z.string().optional(),
  }).optional(),
});

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    logger.debug('[AI Chat] Request received');
    
    const { workspaceId } = await getCurrentWorkspace();
    logger.debug('[AI Chat] Workspace retrieved', { workspaceId });
    
    const user = await getCurrentUser();
    logger.debug('[AI Chat] User retrieved', { userId: user.id });

    // Rate limit expensive AI operations
    const rateLimitResult = await rateLimit(
      `ai:chat:${user.id}`,
      20, // 20 requests
      60  // per minute
    );

    if (!rateLimitResult.success) {
      logger.warn('[AI Chat] Rate limit exceeded', { userId: user.id });
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }
    
    logger.debug('[AI Chat] Rate limit check passed');

    const body = await request.json();
    logger.debug('[AI Chat] Request body received');

    // Validate input
    const validationResult = chatSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('[AI Chat] Validation failed', { errors: validationResult.error.errors });
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { message, conversationId, context } = validationResult.data;
    logger.debug('[AI Chat] Request body parsed', { messageLength: message.length, conversationId, context });

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const existing = await db.query.aiConversations.findFirst({
        where: and(
          eq(aiConversations.id, conversationId),
          eq(aiConversations.workspaceId, workspaceId),
          eq(aiConversations.userId, user.id)
        ),
      });

      if (!existing) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      conversation = existing;
    } else {
      // Create new conversation
      const [newConv] = await db
        .insert(aiConversations)
        .values({
          workspaceId,
          userId: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          lastMessageAt: new Date(),
          messageCount: 0,
        })
        .returning();

      conversation = newConv;
    }

    // Save user message
    const [userMessage] = await db
      .insert(aiMessages)
      .values({
        conversationId: conversation.id,
        role: 'user',
        content: message,
      })
      .returning();

    // Get conversation history for context
    const history = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversation.id),
      orderBy: [asc(aiMessages.createdAt)],
      limit: 20, // Last 20 messages for context
    });

    // Build messages array for OpenAI
    const openai = getOpenAI();
    
    // Build context-aware system prompt
    let systemPrompt = `You are Galaxy AI, a concise and action-oriented assistant. Be brief, direct, and get things done.`;
    
    if (context?.feature === 'agent-creation') {
      systemPrompt += `\n\nYou're helping create an AI agent. Your role is to BRAINSTORM and ask thoughtful questions to create a highly customized agent.

CRITICAL RULES:
1. **NEVER build immediately** - Always ask at least 3-5 clarifying questions before suggesting to build
2. **One question at a time** - Ask ONE thoughtful, specific question per response
3. **Be conversational and curious** - This is a collaborative brainstorming session
4. **Dig deeper** - Don't accept surface-level answers. Ask follow-ups to understand the "why" and "how"
5. **Only suggest building** when you have collected: problem statement, trigger type, data sources, desired outcome, and error handling approach

QUESTION FRAMEWORK - Ask questions in this order based on what you know:

**Phase 1: Understanding the Problem (ALWAYS start here)**
- "What specific problem are you trying to solve with this agent?"
- "What's currently happening that you want to change?"
- "Who will be using this agent, and what's their workflow like?"
- "What would success look like for this agent?"

**Phase 2: Understanding the Context (After you know the problem)**
- "What triggers this agent? (new email, scheduled time, webhook, manual button, etc.)"
- "What data sources does this agent need access to? (CRM, email, calendar, database, APIs)"
- "Are there any specific integrations or tools this needs to connect with?"
- "What information does the agent need to make decisions?"

**Phase 3: Understanding the Logic (After you know context)**
- "What decisions or conditions should the agent consider?"
- "Are there edge cases or exceptions to handle?"
- "What should happen if something goes wrong or data is missing?"
- "Should the agent notify someone, or handle errors silently?"

**Phase 4: Understanding the Output (Before building)**
- "What should the agent do when it completes? (send email, update database, create record, etc.)"
- "Who should be notified about the agent's actions?"
- "Are there any specific formatting or requirements for the output?"

**Phase 5: Ready to Build**
- Only after collecting information from phases 1-4, summarize what you understand
- Ask: "Does this sound right? Should I build the workflow now?"
- Only suggest building when the user confirms

EXAMPLES OF GOOD QUESTIONS:
- "I see you want to automate email responses. What types of emails should it respond to automatically, and which ones should it flag for human review?"
- "For lead qualification, what criteria make a lead 'hot' vs 'warm'? Do you have specific scoring rules?"
- "When this agent processes customer feedback, what should it do with positive vs negative feedback? Should it route them differently?"

EXAMPLES OF BAD RESPONSES (DON'T DO THIS):
- "I'll build that for you right away!" (too fast, no questions)
- "What do you want the agent to do?" (too vague)
- "Here are 5 questions: 1) ... 2) ... 3) ..." (overwhelming)

Be curious, helpful, and guide them to think through their use case thoroughly. The goal is a highly customized agent that solves their specific problem perfectly.`;
    } else if (context?.feature === 'campaign-creation') {
      systemPrompt += `\n\nYou're helping create a marketing campaign. Guide the user through the process quickly. Ask one question at a time. Keep responses under 2 sentences unless summarizing.`;
    } else if (context?.feature === 'content-creation') {
      systemPrompt += `\n\nYou're helping create marketing content. Guide the user through the process quickly. Ask one question at a time. Keep responses under 2 sentences unless summarizing.`;
    } else {
      systemPrompt += `\n\nCurrent workspace: ${context?.workspace || 'General'}. Keep responses brief and actionable.`;
    }
    
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      ...history.slice(-10).map((msg: typeof history[0]) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Call OpenAI - use more tokens for agent creation to allow brainstorming
    const maxTokens = context?.feature === 'agent-creation' ? 500 : 300;
    logger.debug('[AI Chat] Calling OpenAI', { messageCount: messages.length, maxTokens });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: context?.feature === 'agent-creation' ? 0.8 : 0.7, // Slightly more creative for brainstorming
      max_tokens: maxTokens,
    });
    logger.debug('[AI Chat] OpenAI response received', { 
      hasContent: !!completion.choices[0]?.message?.content,
      tokens: completion.usage?.total_tokens 
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
    logger.info('[AI Chat] Success', { duration: `${duration}ms`, conversationId: conversation.id });
    
    return NextResponse.json({
      conversationId: conversation.id,
      message: {
        id: aiMessage.id,
        role: 'assistant',
        content: assistantMessage,
        createdAt: aiMessage.createdAt,
      },
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    return createErrorResponse(error, `AI Chat error (duration: ${duration}ms)`);
  }
}


