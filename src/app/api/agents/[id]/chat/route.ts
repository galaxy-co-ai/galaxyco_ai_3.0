import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, aiConversations, aiMessages, agentExecutions } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
  conversationId: z.string().uuid().optional(),
});

/**
 * Tools the agent can use during conversations to self-adjust
 */
const agentChatTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'update_my_preferences',
      description: 'Update your own preferences or behavior based on user feedback. Use this when the user asks you to change how you work, communicate, or prioritize things.',
      parameters: {
        type: 'object',
        properties: {
          preference_type: {
            type: 'string',
            enum: ['tone', 'verbosity', 'focus_area', 'working_hours', 'notification_style', 'custom'],
            description: 'Type of preference to update',
          },
          value: {
            type: 'string',
            description: 'The new preference value or setting',
          },
          reason: {
            type: 'string',
            description: 'Brief note about why this was changed',
          },
        },
        required: ['preference_type', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_recent_activity',
      description: 'Check your own recent work/executions to provide context in the conversation.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of recent activities to fetch (default: 5)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_note_to_self',
      description: 'Add a note or reminder to yourself about user preferences or important context to remember.',
      parameters: {
        type: 'object',
        properties: {
          note: {
            type: 'string',
            description: 'The note or reminder to save',
          },
          category: {
            type: 'string',
            enum: ['user_preference', 'important_context', 'task_reminder', 'improvement_idea'],
            description: 'Category of the note',
          },
        },
        required: ['note'],
      },
    },
  },
];

/**
 * Execute agent self-management tools
 */
async function executeAgentTool(
  toolName: string,
  args: Record<string, unknown>,
  agentId: string,
  workspaceId: string
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    switch (toolName) {
      case 'update_my_preferences': {
        const agent = await db.query.agents.findFirst({
          where: and(eq(agents.id, agentId), eq(agents.workspaceId, workspaceId)),
        });
        if (!agent) return { success: false, message: 'Agent not found' };

        const currentConfig = agent.config || {};
        const preferences = currentConfig.preferences || {};
        
        // Update the preference
        const updatedPreferences = {
          ...preferences,
          [args.preference_type as string]: {
            value: args.value as string,
            updatedAt: new Date().toISOString(),
            reason: (args.reason as string) || null,
          },
        };

        await db
          .update(agents)
          .set({
            config: { ...currentConfig, preferences: updatedPreferences },
            updatedAt: new Date(),
          })
          .where(eq(agents.id, agentId));

        return {
          success: true,
          message: `Updated ${args.preference_type} preference`,
          data: { preference_type: args.preference_type, value: args.value },
        };
      }

      case 'get_my_recent_activity': {
        const limit = (args.limit as number) || 5;
        const executions = await db.query.agentExecutions.findMany({
          where: and(
            eq(agentExecutions.agentId, agentId),
            eq(agentExecutions.workspaceId, workspaceId)
          ),
          orderBy: [desc(agentExecutions.createdAt)],
          limit,
        });

        return {
          success: true,
          message: `Found ${executions.length} recent activities`,
          data: {
            activities: executions.map(e => ({
              status: e.status,
              completedAt: e.completedAt,
              durationMs: e.durationMs,
              summary: (e.output as { response?: string })?.response?.slice(0, 100),
            })),
          },
        };
      }

      case 'add_note_to_self': {
        const agent = await db.query.agents.findFirst({
          where: and(eq(agents.id, agentId), eq(agents.workspaceId, workspaceId)),
        });
        if (!agent) return { success: false, message: 'Agent not found' };

        const currentConfig = agent.config || {};
        const existingNotes = currentConfig.notes || [];
        
        const newNote = {
          note: args.note as string,
          category: (args.category as string) || 'general',
          createdAt: new Date().toISOString(),
        };

        // Keep only last 20 notes
        const updatedNotes = [...existingNotes, newNote].slice(-20);

        await db
          .update(agents)
          .set({
            config: { ...currentConfig, notes: updatedNotes },
            updatedAt: new Date(),
          })
          .where(eq(agents.id, agentId));

        return {
          success: true,
          message: 'Note saved',
        };
      }

      default:
        return { success: false, message: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    logger.error('Agent tool execution failed', { toolName, error });
    return { success: false, message: 'Tool execution failed' };
  }
}

/**
 * Build a personalized system prompt for the agent
 */
function buildAgentChatPrompt(
  agent: typeof agents.$inferSelect,
  userName: string
): string {
  const config = agent.config as {
    tone?: 'professional' | 'friendly' | 'concise';
    capabilities?: string[];
    systemPrompt?: string;
    preferences?: Record<string, { value: string; reason?: string }>;
    notes?: Array<{ note: string; category: string }>;
  } | null;

  const tone = config?.tone || 'professional';
  const capabilities = config?.capabilities || [];
  const preferences = config?.preferences || {};
  const notes = config?.notes || [];

  // Tone-specific communication style
  const toneStyles: Record<string, string> = {
    professional: 'direct and business-focused. Get to the point quickly.',
    friendly: 'warm but efficient. Be personable without being wordy.',
    concise: 'extremely brief. Use short sentences. No fluff.',
  };

  // Capability descriptions for context
  const capabilityContext: Record<string, string> = {
    crm: 'managing leads and contacts',
    email: 'drafting and sending emails',
    calendar: 'scheduling and calendar management',
    knowledge: 'documents and knowledge base',
    web: 'web research',
  };

  const myCapabilities = capabilities
    .map(c => capabilityContext[c])
    .filter(Boolean)
    .join(', ');

  // Build preference context
  const prefContext = Object.entries(preferences)
    .map(([key, val]) => `${key}: ${val.value}`)
    .join('; ');

  // Build notes context (last 5)
  const notesContext = notes
    .slice(-5)
    .map(n => `- ${n.note}`)
    .join('\n');

  return `You are ${agent.name}. You work for ${userName}.

${agent.description || ''}

PERSONALITY:
- Be ${toneStyles[tone]}
- Respond like a competent employee, not an AI assistant
- Never start with "I" - vary your sentence structure
- Keep responses under 2-3 sentences unless the user asks for detail
- Don't explain what you're doing, just do it or confirm it's done
- Use "got it", "done", "on it" style acknowledgments
- If you don't know something, say so briefly

${myCapabilities ? `YOUR SKILLS: ${myCapabilities}` : ''}

${prefContext ? `YOUR PREFERENCES:\n${prefContext}` : ''}

${notesContext ? `NOTES TO REMEMBER:\n${notesContext}` : ''}

SELF-IMPROVEMENT:
When ${userName} gives you feedback or asks you to change how you work:
- Use update_my_preferences to save the change
- Use add_note_to_self for important context to remember
- Confirm briefly, then apply the change going forward

Don't announce that you're saving preferences - just do it naturally.`;
}

// GET: Fetch conversation history for an agent
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: agentId } = await params;

    const agent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, agentId),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Find agent conversation
    const conversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, user.id)
      ),
      orderBy: [desc(aiConversations.lastMessageAt)],
    });

    const agentConversation = conversations.find(c => 
      (c.context as { agentId?: string })?.agentId === agentId
    );

    if (!agentConversation) {
      return NextResponse.json({
        agent: { id: agent.id, name: agent.name, description: agent.description, status: agent.status },
        conversation: null,
        messages: [],
      });
    }

    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, agentConversation.id),
      orderBy: [asc(aiMessages.createdAt)],
    });

    return NextResponse.json({
      agent: { id: agent.id, name: agent.name, description: agent.description, status: agent.status },
      conversation: { id: agentConversation.id, messageCount: agentConversation.messageCount },
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
    const rateLimitResult = await rateLimit(`agent:chat:${user.id}`, 30, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Slow down - too many messages.' },
        { status: 429 }
      );
    }

    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.workspaceId, workspaceId)),
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = chatSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    const { message, conversationId } = validationResult.data;

    // Get or create conversation
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
      const [newConv] = await db
        .insert(aiConversations)
        .values({
          workspaceId,
          userId: user.id,
          title: `Chat with ${agent.name}`,
          lastMessageAt: new Date(),
          messageCount: 0,
          context: { agentId: agent.id },
        })
        .returning();
      conversation = newConv;
    }

    // Save user message
    await db.insert(aiMessages).values({
      conversationId: conversation.id,
      role: 'user',
      content: message,
    });

    // Get conversation history
    const history = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversation.id),
      orderBy: [asc(aiMessages.createdAt)],
      limit: 20,
    });

    // Build personalized system prompt
    const userName = user.name || 'Boss';
    const systemPrompt = buildAgentChatPrompt(agent, userName);

    // Prepare messages for OpenAI
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Call OpenAI with tools for self-adjustment
    const openai = getOpenAI();
    let response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: agentChatTools,
      temperature: 0.8,
      max_tokens: 300, // Keep responses concise
    });

    // Handle any tool calls (self-adjustment)
    let iterations = 0;
    while (response.choices[0]?.message?.tool_calls && iterations < 3) {
      iterations++;
      const toolCalls = response.choices[0].message.tool_calls;
      messages.push(response.choices[0].message);

      for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') continue;
        
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        
        logger.info('Agent self-adjusting', { agentId, tool: toolName });
        
        const result = await executeAgentTool(toolName, toolArgs, agentId, workspaceId);
        
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: agentChatTools,
        temperature: 0.8,
        max_tokens: 300,
      });
    }

    const assistantMessage = response.choices[0]?.message?.content || 
      "Got it.";

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

    logger.info('[Agent Chat]', { 
      duration: `${Date.now() - startTime}ms`, 
      agentId,
      selfAdjusted: iterations > 0,
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

// DELETE: Clear conversation history
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: agentId } = await params;

    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.workspaceId, workspaceId)),
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const conversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, user.id)
      ),
    });

    const agentConversation = conversations.find(c => 
      (c.context as { agentId?: string })?.agentId === agentId
    );

    if (agentConversation) {
      await db.delete(aiMessages).where(eq(aiMessages.conversationId, agentConversation.id));
      await db.delete(aiConversations).where(eq(aiConversations.id, agentConversation.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete agent chat error');
  }
}
