import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiConversations, aiMessages, users } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

// AI Module imports
import { aiTools, executeTool, getToolsForCapability, type ToolContext, type ToolResult } from '@/lib/ai/tools';
import { gatherAIContext, getQuickContext } from '@/lib/ai/context';
import { generateSystemPrompt } from '@/lib/ai/system-prompt';
import { trackFrequentQuestion, analyzeConversationForLearning, updateUserPreferencesFromInsights } from '@/lib/ai/memory';
import { processDocuments } from '@/lib/document-processing';
import { shouldAutoExecute, recordActionExecution } from '@/lib/ai/autonomy-learning';

import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    workspace: z.string().optional(),
    feature: z.string().optional(),
    page: z.string().optional(),
  }).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Process tool calls from GPT-4 response with autonomy learning
 */
async function processToolCalls(
  toolCalls: Array<{
    id: string;
    type: string;
    function?: { name: string; arguments: string };
  }>,
  toolContext: ToolContext
): Promise<Array<{ toolCallId: string; name: string; result: string; requiresConfirmation?: boolean; autoExecuted?: boolean }>> {
  const results = [];

  for (const toolCall of toolCalls) {
    const { id, function: func } = toolCall;
    
    if (!func) {
      continue; // Skip non-function tool calls
    }
    
    try {
      const args = JSON.parse(func.arguments);
      
      // Check if we should auto-execute based on learned preferences
      const autonomyCheck = await shouldAutoExecute(
        func.name,
        toolContext.workspaceId,
        toolContext.userId
      );

      const startTime = Date.now();
      let result;
      let autoExecuted = false;

      if (autonomyCheck.autoExecute) {
        // Auto-execute: Low-risk or high-confidence learned action
        result = await executeTool(func.name, args, toolContext);
        autoExecuted = true;
        
        const executionTime = Date.now() - startTime;
        await recordActionExecution(
          toolContext.workspaceId,
          toolContext.userId,
          func.name,
          true, // wasAutomatic
          null, // userApproved (not asked)
          executionTime,
          result.success ? 'success' : 'failed'
        );
      } else {
        // Requires confirmation: Medium/high-risk or low confidence
        result = {
          success: false,
          message: `Action "${func.name}" requires confirmation. ${autonomyCheck.reason}`,
          data: {
            requiresConfirmation: true,
            toolName: func.name,
            args,
            confidence: autonomyCheck.confidence,
            reason: autonomyCheck.reason,
          },
        };
      }
      
      results.push({
        toolCallId: id,
        name: func.name,
        result: JSON.stringify(result),
        requiresConfirmation: !autonomyCheck.autoExecute,
        autoExecuted,
      });
    } catch (error) {
      logger.error('Failed to execute tool call', { toolName: func.name, error });
      results.push({
        toolCallId: id,
        name: func.name,
        result: JSON.stringify({
          success: false,
          message: 'Tool execution failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }

  return results;
}

// ============================================================================
// MAIN CHAT ENDPOINT
// ============================================================================

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    logger.debug('[AI Chat] Request received');
    
    // Get workspace and user context
    const { workspaceId, userId: clerkUserId } = await getCurrentWorkspace();
    logger.debug('[AI Chat] Workspace retrieved', { workspaceId });
    
    const currentUser = await getCurrentUser();
    logger.debug('[AI Chat] User retrieved', { userId: currentUser.id });

    // Rate limit expensive AI operations
    const rateLimitResult = await rateLimit(
      `ai:chat:${currentUser.id}`,
      20, // 20 requests
      60  // per minute
    );

    if (!rateLimitResult.success) {
      logger.warn('[AI Chat] Rate limit exceeded', { userId: currentUser.id });
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }
    
    logger.debug('[AI Chat] Rate limit check passed');

    // Parse and validate request body
    const body = await request.json();
    const validationResult = chatSchema.safeParse(body);
    
    if (!validationResult.success) {
      logger.warn('[AI Chat] Validation failed', { errors: validationResult.error.errors });
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { message, conversationId, context } = validationResult.data;
    logger.debug('[AI Chat] Request validated', { 
      messageLength: message.length, 
      conversationId, 
      feature: context?.feature 
    });

    // Get user's database record (getCurrentUser already handles auto-creation)
    const userRecord = currentUser;

    // Gather comprehensive AI context
    const aiContext = await gatherAIContext(workspaceId, clerkUserId);
    logger.debug('[AI Chat] AI context gathered', { hasContext: !!aiContext });

    // Generate system prompt with full context
    const systemPrompt = generateSystemPrompt(aiContext, context?.feature);
    logger.debug('[AI Chat] System prompt generated', { promptLength: systemPrompt.length });

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const existing = await db.query.aiConversations.findFirst({
        where: and(
          eq(aiConversations.id, conversationId),
          eq(aiConversations.workspaceId, workspaceId),
          eq(aiConversations.userId, userRecord.id)
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
          userId: userRecord.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          lastMessageAt: new Date(),
          messageCount: 0,
          context: {
            page: context?.page,
            timestamp: new Date().toISOString(),
          },
        })
        .returning();

      conversation = newConv;
      logger.debug('[AI Chat] Created new conversation', { conversationId: newConv.id });
    }

    // Parse attachments from request
    const attachments = body.attachments as Array<{
      type: 'image' | 'document' | 'file';
      url: string;
      name: string;
      size: number;
      mimeType: string;
    }> | undefined;

    // Process document attachments to extract text
    let documentContext = '';
    if (attachments && attachments.length > 0) {
      try {
        documentContext = await processDocuments(attachments);
        logger.debug('Document text extracted', {
          documentsProcessed: attachments.filter(a => a.type === 'document').length,
          textLength: documentContext.length,
        });
      } catch (error) {
        logger.error('Document processing error (non-blocking)', error);
      }
    }

    // Combine user message with document context
    const fullMessage = documentContext 
      ? `${message}\n\n--- Attached Documents ---\n${documentContext}`
      : message;

    // Save user message with attachments
    const [userMessage] = await db
      .insert(aiMessages)
      .values({
        conversationId: conversation.id,
        role: 'user',
        content: fullMessage,
        attachments: attachments && attachments.length > 0 ? attachments : null,
      })
      .returning();

    // Track frequent question (async, non-blocking)
    trackFrequentQuestion(workspaceId, userRecord.id, message).catch(() => {});

    // Get conversation history for context
    const history = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversation.id),
      orderBy: [asc(aiMessages.createdAt)],
      limit: 20,
    });

    // Build messages array for OpenAI with vision support
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...history.slice(-15).map((msg): ChatCompletionMessageParam => {
        // Check if message has image attachments
        const attachments = msg.attachments as Array<{type: string; url: string}> | undefined;
        const imageAttachments = attachments?.filter(att => att.type === 'image') || [];
        
        if (imageAttachments.length > 0 && msg.role === 'user') {
          // Format with vision support - only user messages can have images
          return {
            role: 'user',
            content: [
              { type: 'text' as const, text: msg.content },
              ...imageAttachments.map(img => ({
                type: 'image_url' as const,
                image_url: { url: img.url },
              })),
            ],
          };
        }
        
        // Regular text message
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        };
      }),
    ];

    // Select tools based on feature context
    const tools: ChatCompletionTool[] = context?.feature
      ? getToolsForCapability(context.feature)
      : aiTools;

    // Setup tool context
    const toolContext: ToolContext = {
      workspaceId,
      userId: clerkUserId,
      userEmail: userRecord.email,
      userName: [userRecord.firstName, userRecord.lastName].filter(Boolean).join(' ') || userRecord.email.split('@')[0],
    };

    // Call OpenAI with function calling
    const openai = getOpenAI();
    logger.debug('[AI Chat] Calling OpenAI', { 
      messageCount: messages.length, 
      toolCount: tools.length 
    });

    let assistantMessage: string;
    const toolCallsMade: Array<{ name: string; result: ToolResult }> = [];

    try {
      // First API call
      let completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: 0.8,
        max_tokens: 300,
        frequency_penalty: 0.3,
        presence_penalty: 0.2,
      });

      let responseMessage = completion.choices[0]?.message;
      
      // Handle tool calls (may require multiple rounds)
      let iterations = 0;
      const maxIterations = 5; // Safety limit

      while (responseMessage?.tool_calls && iterations < maxIterations) {
        iterations++;
        logger.debug('[AI Chat] Processing tool calls', { 
          count: responseMessage.tool_calls.length,
          iteration: iterations 
        });

        // Execute all tool calls
        const toolResults = await processToolCalls(
          responseMessage.tool_calls,
          toolContext
        );

        // Track which tools were called with full results
        toolCallsMade.push(...toolResults.map(r => {
          let parsedResult: ToolResult;
          try {
            parsedResult = JSON.parse(r.result) as ToolResult;
          } catch {
            parsedResult = {
              success: false,
              message: 'Failed to parse tool result',
            };
          }
          return {
            name: r.name,
            result: parsedResult,
          };
        }));

        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: responseMessage.content,
          tool_calls: responseMessage.tool_calls,
        });

        // Add tool results
        for (const result of toolResults) {
          messages.push({
            role: 'tool',
            tool_call_id: result.toolCallId,
            content: result.result,
          });
        }

        // Call OpenAI again with tool results
        completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: tools.length > 0 ? 'auto' : undefined,
          temperature: 0.8,
          max_tokens: 300,
          frequency_penalty: 0.3,
          presence_penalty: 0.2,
        });

        responseMessage = completion.choices[0]?.message;
      }

      assistantMessage = responseMessage?.content || 
        "I apologize, but I couldn't generate a response. Please try again.";

      logger.debug('[AI Chat] OpenAI response received', { 
        hasContent: !!assistantMessage,
        tokens: completion.usage?.total_tokens,
        toolCallCount: toolCallsMade.length,
      });
    } catch (openaiError) {
      logger.error('[AI Chat] OpenAI API error', openaiError);
      
      // Provide a helpful fallback message
      assistantMessage = "I encountered an issue while processing your request. Please try again, or let me know if you'd like help with something else.";
    }

    // Save assistant message
    const [aiMessage] = await db
      .insert(aiMessages)
      .values({
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage,
        metadata: toolCallsMade.length > 0 
          ? { 
              functionCalls: toolCallsMade.map(toolCall => ({ 
                name: toolCall.name, 
                args: {}, 
                result: toolCall.result 
              }))
            }
          : undefined,
      })
      .returning();

    // Update conversation
    await db
      .update(aiConversations)
      .set({
        lastMessageAt: new Date(),
        messageCount: conversation.messageCount + 2,
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, conversation.id));

    // Trigger background learning after 5+ message exchanges
    if (conversation.messageCount >= 10) {
      // Async, non-blocking
      analyzeConversationForLearning(conversation.id, workspaceId, userRecord.id)
        .then((insights) => {
          if (insights.length > 0) {
            return updateUserPreferencesFromInsights(workspaceId, userRecord.id, insights);
          }
        })
        .catch((err) => logger.error('Background learning failed', err));
    }

    const duration = Date.now() - startTime;
    logger.info('[AI Chat] Success', { 
      duration: `${duration}ms`, 
      conversationId: conversation.id,
      toolsUsed: toolCallsMade,
    });
    
    return NextResponse.json({
      conversationId: conversation.id,
      message: {
        id: aiMessage.id,
        role: 'assistant',
        content: assistantMessage,
        createdAt: aiMessage.createdAt,
        metadata: aiMessage.metadata,
      },
      context: {
        userName: toolContext.userName,
        toolsExecuted: toolCallsMade.map(tc => typeof tc === 'string' ? tc : tc.name),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    return createErrorResponse(error, `AI Chat error (duration: ${duration}ms)`);
  }
}
