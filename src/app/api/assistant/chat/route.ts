import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiConversations, aiMessages } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// AI Module imports
import { aiTools, executeTool, getToolsForCapability, type ToolContext, type ToolResult } from '@/lib/ai/tools';
import { gatherAIContext } from '@/lib/ai/context';
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
  attachments: z.array(z.object({
    type: z.enum(['image', 'document', 'file']),
    url: z.string(),
    name: z.string(),
    size: z.number(),
    mimeType: z.string(),
  })).optional(),
  context: z.object({
    workspace: z.string().optional(),
    feature: z.string().optional(),
    page: z.string().optional(),
    type: z.string().optional(),
  }).optional(),
  feature: z.string().optional(),
});

// ============================================================================
// STREAMING HELPERS
// ============================================================================

/**
 * Create an SSE stream response
 */
function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  return {
    stream,
    send: (data: Record<string, unknown>) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    },
    sendContent: (content: string) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
    },
    sendError: (error: string) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error })}\n\n`));
    },
    sendDone: (data?: Record<string, unknown>) => {
      if (data) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ ...data, done: true })}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
    close: () => {
      try {
        controller.close();
      } catch {
        // Already closed
      }
    },
  };
}

/**
 * Process tool calls with autonomy learning
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
      continue;
    }
    
    try {
      const args = JSON.parse(func.arguments);
      
      const autonomyCheck = await shouldAutoExecute(
        func.name,
        toolContext.workspaceId,
        toolContext.userId
      );

      const startTime = Date.now();
      let result;
      let autoExecuted = false;

      if (autonomyCheck.autoExecute) {
        result = await executeTool(func.name, args, toolContext);
        autoExecuted = true;
        
        const executionTime = Date.now() - startTime;
        await recordActionExecution(
          toolContext.workspaceId,
          toolContext.userId,
          func.name,
          true,
          null,
          executionTime,
          result.success ? 'success' : 'failed'
        );
      } else {
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
// MAIN STREAMING CHAT ENDPOINT
// ============================================================================

export async function POST(request: Request) {
  const startTime = Date.now();
  const sse = createSSEStream();
  
  // Start async processing
  (async () => {
    try {
      logger.debug('[AI Chat Stream] Request received');
      
      // Get workspace and user context
      let workspaceId: string;
      let clerkUserId: string;
      let currentUser;

      try {
        const workspaceResult = await getCurrentWorkspace();
        workspaceId = workspaceResult.workspaceId;
        clerkUserId = workspaceResult.userId;
        currentUser = await getCurrentUser();
      } catch (authError) {
        logger.error('[AI Chat Stream] Authentication error', authError);
        sse.sendError('Please sign in to use Neptune.');
        sse.sendDone();
        return;
      }

      // Rate limit
      const rateLimitResult = await rateLimit(
        `ai:chat:${currentUser.id}`,
        20,
        60
      );

      if (!rateLimitResult.success) {
        logger.warn('[AI Chat Stream] Rate limit exceeded', { userId: currentUser.id });
        sse.sendError('Rate limit exceeded. Please try again in a moment.');
        sse.sendDone();
        return;
      }

      // Parse and validate request body
      const body = await request.json();
      const validationResult = chatSchema.safeParse(body);
      
      if (!validationResult.success) {
        logger.warn('[AI Chat Stream] Validation failed', { errors: validationResult.error.errors });
        sse.sendError('Invalid request: ' + validationResult.error.errors[0]?.message);
        sse.sendDone();
        return;
      }

      const { message, conversationId, attachments, context, feature } = validationResult.data;
      logger.debug('[AI Chat Stream] Request validated', { 
        messageLength: message.length, 
        conversationId, 
        feature: feature || context?.feature 
      });

      const userRecord = currentUser;

      // Gather AI context
      const aiContext = await gatherAIContext(workspaceId, clerkUserId);
      const systemPrompt = generateSystemPrompt(aiContext, feature || context?.feature);

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
          sse.sendError('Conversation not found');
          sse.sendDone();
          return;
        }

        conversation = existing;
      } else {
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
        logger.debug('[AI Chat Stream] Created new conversation', { conversationId: newConv.id });
      }

      // Send conversation ID early so client can track it
      sse.send({ conversationId: conversation.id });

      // Process document attachments
      let documentContext = '';
      if (attachments && attachments.length > 0) {
        try {
          documentContext = await processDocuments(attachments);
          logger.debug('[AI Chat Stream] Document text extracted', {
            documentsProcessed: attachments.filter(a => a.type === 'document').length,
            textLength: documentContext.length,
          });
        } catch (error) {
          logger.error('[AI Chat Stream] Document processing error (non-blocking)', error);
        }
      }

      // Combine user message with document context
      const fullMessage = documentContext 
        ? `${message}\n\n--- Attached Documents ---\n${documentContext}`
        : message;

      // Save user message
      await db
        .insert(aiMessages)
        .values({
          conversationId: conversation.id,
          role: 'user',
          content: fullMessage,
          attachments: attachments && attachments.length > 0 ? attachments : null,
        });

      // Track frequent question (async, non-blocking)
      trackFrequentQuestion(workspaceId, userRecord.id, message).catch(() => {});

      // Get conversation history
      const history = await db.query.aiMessages.findMany({
        where: eq(aiMessages.conversationId, conversation.id),
        orderBy: [asc(aiMessages.createdAt)],
        limit: 30,
      });

      // Build messages array with vision support
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...history.slice(-25).map((msg): ChatCompletionMessageParam => {
          const msgAttachments = msg.attachments as Array<{type: string; url: string}> | undefined;
          const imageAttachments = msgAttachments?.filter(att => att.type === 'image') || [];
          
          if (imageAttachments.length > 0 && msg.role === 'user') {
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
          
          return {
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          };
        }),
      ];

      // Select tools based on feature context
      const activeFeature = feature || context?.feature;
      const tools: ChatCompletionTool[] = activeFeature
        ? getToolsForCapability(activeFeature)
        : aiTools;

      // Setup tool context
      const toolContext: ToolContext = {
        workspaceId,
        userId: clerkUserId,
        userEmail: userRecord.email,
        userName: [userRecord.firstName, userRecord.lastName].filter(Boolean).join(' ') || userRecord.email.split('@')[0],
      };

      // Call OpenAI with streaming
      const openai = getOpenAI();
      logger.debug('[AI Chat Stream] Starting OpenAI stream', { 
        messageCount: messages.length, 
        toolCount: tools.length 
      });

      let fullResponse = '';
      const toolCallsMade: Array<{ name: string; result: ToolResult }> = [];
      let iterations = 0;
      const maxIterations = 5;

      // Streaming with tool call loop
      let continueLoop = true;
      while (continueLoop && iterations < maxIterations) {
        iterations++;
        
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: tools.length > 0 ? 'auto' : undefined,
          temperature: 0.5,
          max_tokens: 1500,
          frequency_penalty: 0.3,
          presence_penalty: 0.2,
          stream: true,
        });

        // Collect streamed response
        let currentContent = '';
        let currentToolCalls: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }> = [];
        let finishReason: string | null = null;

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          finishReason = chunk.choices[0]?.finish_reason || finishReason;

          // Stream content tokens immediately
          if (delta?.content) {
            currentContent += delta.content;
            fullResponse += delta.content;
            sse.sendContent(delta.content);
          }

          // Accumulate tool calls
          if (delta?.tool_calls) {
            for (const toolCallDelta of delta.tool_calls) {
              const index = toolCallDelta.index;
              
              // Initialize tool call if needed
              if (!currentToolCalls[index]) {
                currentToolCalls[index] = {
                  id: toolCallDelta.id || '',
                  type: 'function',
                  function: { name: '', arguments: '' },
                };
              }

              // Update tool call fields
              if (toolCallDelta.id) {
                currentToolCalls[index].id = toolCallDelta.id;
              }
              if (toolCallDelta.function?.name) {
                currentToolCalls[index].function.name += toolCallDelta.function.name;
              }
              if (toolCallDelta.function?.arguments) {
                currentToolCalls[index].function.arguments += toolCallDelta.function.arguments;
              }
            }
          }
        }

        // Check if we need to execute tool calls
        if (finishReason === 'tool_calls' && currentToolCalls.length > 0) {
          logger.debug('[AI Chat Stream] Processing tool calls', { 
            count: currentToolCalls.length,
            iteration: iterations 
          });

          // Notify client that we're executing tools
          sse.send({ 
            toolExecution: true, 
            tools: currentToolCalls.map(tc => tc.function.name) 
          });

          // Execute tool calls
          const toolResults = await processToolCalls(currentToolCalls, toolContext);

          // Track which tools were called
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

          // Add assistant message with tool calls to conversation
          messages.push({
            role: 'assistant',
            content: currentContent || null,
            tool_calls: currentToolCalls,
          });

          // Add tool results
          for (const result of toolResults) {
            messages.push({
              role: 'tool',
              tool_call_id: result.toolCallId,
              content: result.result,
            });
          }

          // Notify client of tool results
          sse.send({ 
            toolResults: toolResults.map(r => ({
              name: r.name,
              success: JSON.parse(r.result).success,
            }))
          });

          // Continue loop to get AI response to tool results
        } else {
          // No more tool calls, we're done
          continueLoop = false;
        }
      }

      // Warn if max iterations reached
      if (iterations >= maxIterations) {
        logger.warn('[AI Chat Stream] Max tool iterations reached', {
          maxIterations,
          toolCallsMade: toolCallsMade.map(tc => tc.name),
          conversationId: conversation.id,
        });
      }

      // Fallback message if no content
      if (!fullResponse.trim()) {
        fullResponse = "I apologize, but I couldn't generate a response. Please try again.";
        sse.sendContent(fullResponse);
      }

      // Save assistant message
      const [aiMessage] = await db
        .insert(aiMessages)
        .values({
          conversationId: conversation.id,
          role: 'assistant',
          content: fullResponse,
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
        analyzeConversationForLearning(conversation.id, workspaceId, userRecord.id)
          .then((insights) => {
            if (insights.length > 0) {
              return updateUserPreferencesFromInsights(workspaceId, userRecord.id, insights);
            }
          })
          .catch((err) => logger.error('[AI Chat Stream] Background learning failed', err));
      }

      const duration = Date.now() - startTime;
      logger.info('[AI Chat Stream] Success', { 
        duration: `${duration}ms`, 
        conversationId: conversation.id,
        toolsUsed: toolCallsMade.map(tc => tc.name),
        responseLength: fullResponse.length,
      });

      // Send completion message
      sse.sendDone({
        conversationId: conversation.id,
        messageId: aiMessage.id,
        toolsExecuted: toolCallsMade.map(tc => tc.name),
        metadata: aiMessage.metadata,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('[AI Chat Stream] Error', { error, duration: `${duration}ms` });
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      sse.sendError(errorMessage);
      sse.sendDone();
    }
  })();

  // Return the stream immediately
  return new Response(sse.stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
