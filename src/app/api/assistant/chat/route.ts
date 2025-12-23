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
import { getCachedResponse, cacheResponse } from '@/lib/ai/cache';
import { trackNeptuneRequest, trackNeptuneError } from '@/lib/observability';
import { classifyIntent } from '@/lib/ai/intent-classifier';

import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
  conversationId: z.string().uuid().nullish(),
  attachments: z.array(z.object({
    type: z.enum(['image', 'document', 'file']),
    url: z.string(),
    name: z.string(),
    size: z.number(),
    mimeType: z.string(),
  })).optional(),
  context: z.object({
    workspace: z.string().nullish(),
    feature: z.string().nullish(),
    page: z.string().nullish(),
    type: z.string().nullish(),
  }).nullish(),
  feature: z.string().nullish(),
});

// ============================================================================
// ROADMAP RECALCULATION (Phase 1E)
// ============================================================================

/**
 * Trigger roadmap recalculation after significant actions
 * Runs async to not block the response stream
 */
async function triggerRoadmapRecalculation(
  workspaceId: string, 
  toolName: string
): Promise<void> {
  // Only recalculate for milestone-relevant actions
  const milestoneActions = [
    'create_lead',
    'create_contact',
    'create_agent',
    'create_agent_quick',
    'run_agent',
    'create_document',
    'create_collection',
    'connect_integration',
    'create_task',
    'create_campaign',
  ];
  
  if (!milestoneActions.includes(toolName)) {
    return; // Skip non-milestone actions
  }
  
  try {
    // Import health assessment
    const { assessWorkspaceHealth } = await import('@/lib/ai/workspace-health');
    const { generateDynamicRoadmap } = await import('@/lib/ai/roadmap-engine');
    const { gatherAIContext } = await import('@/lib/ai/context');
    
    // Get fresh workspace health
    const health = await assessWorkspaceHealth(workspaceId);
    
    // Get company type from context
    const context = await gatherAIContext(workspaceId, workspaceId); // Using workspaceId as placeholder
    const companyType = context?.website?.companyDescription 
      ? (await import('@/lib/ai/roadmap-engine')).detectCompanyVertical(context.website.companyDescription)
      : 'other';
    
    // Regenerate roadmap
    const roadmap = await generateDynamicRoadmap(health, companyType);
    
    logger.debug('Roadmap recalculated after action', {
      workspaceId,
      toolName,
      progress: roadmap.progress.percentage,
      completed: roadmap.progress.completedCount,
    });
  } catch (error) {
    logger.warn('Roadmap recalculation failed (non-critical)', { error, toolName });
  }
}

// ============================================================================
// COMPLEX QUESTION DETECTION
// ============================================================================

/**
 * Detect if a question requires chain-of-thought reasoning
 */
function detectComplexQuestion(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  const complexIndicators = [
    'strategy', 'strategic', 'plan', 'planning',
    'compare', 'comparison', 'versus', 'vs', 'difference between',
    'analyze', 'analysis', 'evaluate', 'assessment',
    'recommend', 'recommendation', 'suggest', 'advice',
    'best approach', 'best way', 'how should', 'what should',
    'pros and cons', 'advantages', 'disadvantages',
    'why', 'explain why', 'reason', 'reasoning',
    'complex', 'complicated', 'multiple', 'several',
  ];

  // Check for complex question patterns
  const hasComplexIndicator = complexIndicators.some(indicator => 
    lowerMessage.includes(indicator)
  );

  // Check for multiple question marks or long questions
  const questionCount = (message.match(/\?/g) || []).length;
  const isLongQuestion = message.length > 100;

  // Check for comparison words
  const hasComparison = /\b(vs|versus|compared to|better than|worse than|instead of)\b/i.test(message);

  return hasComplexIndicator || (questionCount > 1) || (isLongQuestion && hasComparison);
}

/**
 * Detect URLs in a message
 */
function detectUrls(message: string): string[] {
  // Match full URLs (http://, https://)
  const fullUrlRegex = /https?:\/\/[^\s<>"']+/gi;
  // Match domain patterns (example.com, www.example.com, example.io, etc.)
  const domainRegex = /(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?:\/[^\s<>"']*)?/gi;
  
  const fullUrls = [...message.matchAll(fullUrlRegex)].map(m => m[0]);
  const domains = [...message.matchAll(domainRegex)].map(m => m[0]);
  
  // Combine and deduplicate
  const allUrls = [...new Set([...fullUrls, ...domains])];
  
  // Filter out common false positives (email addresses, common words)
  const falsePositives = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  return allUrls.filter(url => {
    // Skip if it's part of an email
    if (/\S+@\S+/.test(message) && message.includes(url)) {
      return false;
    }
    // Skip common false positives
    if (falsePositives.some(fp => url.includes(fp))) {
      return false;
    }
    // Must have a valid TLD
    return /\.(com|net|org|io|ai|co|app|dev|tech|online|site|website|xyz|info|biz|us|uk|ca|au|de|fr|jp|cn|in|br|ru|es|it|nl|se|no|dk|fi|pl|cz|at|ch|be|ie|pt|gr|ro|hu|bg|hr|sk|si|lt|lv|ee|lu|mt|cy|is|li|mc|ad|sm|va|ax|fo|gi|je|gg|im|mt|mk|me|rs|ba|al|md|ua|by|ge|am|az|kz|kg|tj|tm|uz|mn|mo|hk|tw|sg|my|th|ph|vn|id|kr|jp|cn|in|pk|bd|lk|np|mm|kh|la|bn|tl|pg|fj|nc|pf|ws|to|vu|sb|ki|pw|fm|mh|nr|tv|ck|nu|pn|tk|gs|ac|io|sh|cx|cc|nf|hm|aq|tf|bv|sj|um|as|gu|mp|vi|pr|ky|vg|ai|ag|aw|bb|bs|bz|bm|br|vg|ky|co|cu|dm|do|ec|fk|gd|gp|gt|gy|hn|ht|jm|kn|lc|mq|ms|mx|ni|pa|pe|py|sr|sv|tc|tt|uy|ve|wf|ws|ax|dk|ee|fi|fo|gl|is|ie|im|je|lv|lt|lu|mt|no|pt|se|sj|sk|si|uk|ad|al|at|ba|be|bg|by|ch|cy|cz|de|es|fr|gb|gg|gi|gr|hr|hu|ie|im|is|it|je|li|lu|lv|mc|md|me|mk|mt|nl|no|pl|pt|ro|rs|se|si|sk|sm|ua|va|yu|za|zw|ae|af|ag|ai|al|am|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bl|bm|bn|bo|bq|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cw|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mf|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tr|tt|tv|tw|tz|ua|ug|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)/i.test(url);
  });
}

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
 * Process tool calls with autonomy learning and parallel execution
 * Independent tools are executed simultaneously for better performance
 */
async function processToolCalls(
  toolCalls: Array<{
    id: string;
    type: string;
    function?: { name: string; arguments: string };
  }>,
  toolContext: ToolContext
): Promise<Array<{ toolCallId: string; name: string; result: string; requiresConfirmation?: boolean; autoExecuted?: boolean }>> {
  
  // Filter out invalid tool calls
  const validToolCalls = toolCalls.filter(tc => tc.function);
  
  if (validToolCalls.length === 0) {
    return [];
  }

  logger.info('[AI Chat] Executing tools in parallel', { 
    toolCount: validToolCalls.length,
    tools: validToolCalls.map(tc => tc.function?.name)
  });

  // Execute all tools in parallel using Promise.all
  const results = await Promise.all(
    validToolCalls.map(async (toolCall) => {
      const { id, function: func } = toolCall;
      
      if (!func) {
        return null;
      }
      
      try {
        const args = JSON.parse(func.arguments);
        
        // Check autonomy (fast operation, OK to do in parallel)
        const autonomyCheck = await shouldAutoExecute(
          func.name,
          toolContext.workspaceId,
          toolContext.userId
        );

        const startTime = Date.now();
        let result;
        let autoExecuted = false;

        if (autonomyCheck.autoExecute) {
          // Execute the tool
          result = await executeTool(func.name, args, toolContext);
          autoExecuted = true;
          
          // Record execution (async, non-blocking)
          const executionTime = Date.now() - startTime;
          recordActionExecution(
            toolContext.workspaceId,
            toolContext.userId,
            func.name,
            true,
            null,
            executionTime,
            result.success ? 'success' : 'failed'
          ).catch(err => logger.warn('Failed to record execution', { err }));
          
          // Phase 1E: Trigger roadmap recalculation after successful actions
          if (result.success) {
            triggerRoadmapRecalculation(toolContext.workspaceId, func.name)
              .catch(err => logger.warn('Failed to recalculate roadmap', { err }));
          }
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
        
        return {
          toolCallId: id,
          name: func.name,
          result: JSON.stringify(result),
          requiresConfirmation: !autonomyCheck.autoExecute,
          autoExecuted,
        };
      } catch (error) {
        logger.error('Failed to execute tool call', { toolName: func.name, error });
        return {
          toolCallId: id,
          name: func.name,
          result: JSON.stringify({
            success: false,
            message: 'Tool execution failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        };
      }
    })
  );

  // Filter out nulls and return
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
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

      // Check semantic cache for similar queries (only for queries without attachments)
      if (!attachments || attachments.length === 0) {
        const cachedResponse = await getCachedResponse(message, workspaceId);
        if (cachedResponse) {
          logger.info('[AI Chat Stream] Cache hit - returning cached response', {
            query: message.slice(0, 50),
          });

          // Stream the cached response to maintain UX consistency
          const words = cachedResponse.response.split(' ');
          for (let i = 0; i < words.length; i += 3) {
            const chunk = words.slice(i, i + 3).join(' ') + ' ';
            sse.sendContent(chunk);
            // Small delay for natural feel
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Track cached response metrics
          const duration = Date.now() - startTime;
          trackNeptuneRequest(duration, {
            userId: currentUser.id,
            workspaceId,
            cached: true,
            tokensUsed: 0, // Cached responses use no new tokens
            ragResultsCount: 0,
          });

          sse.sendDone({
            conversationId: conversationId || 'cached',
            cached: true,
            toolsExecuted: cachedResponse.toolsUsed,
          });
          return;
        }
      }

      // Gather AI context
      const aiContext = await gatherAIContext(workspaceId, clerkUserId);
      
      // Classify intent for proactive suggestions (Phase 1B)
      let intentClassification;
      if (aiContext) {
        try {
          intentClassification = await classifyIntent(message, aiContext);
          
          logger.info('[AI Chat Stream] Intent classified', {
            intent: intentClassification.intent,
            confidence: intentClassification.confidence,
            method: intentClassification.detectionMethod,
            processingTime: `${intentClassification.processingTimeMs}ms`,
          });
        } catch (error) {
          logger.warn('[AI Chat Stream] Intent classification failed (non-blocking)', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          intentClassification = undefined;
        }
      }
      
      const systemPrompt = generateSystemPrompt(
        aiContext, 
        feature || context?.feature || undefined,
        intentClassification
      );

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
              page: context?.page || undefined,
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
      
      // Phase 2A: Analyze user's communication style (every 5 messages)
      // Run in background after history is loaded
      if (conversation.messageCount > 0 && conversation.messageCount % 5 === 0) {
        (async () => {
          try {
            const { analyzeUserStyle, updateCommunicationStyle } = await import('@/lib/ai/communication-analyzer');
            
            // Get recent messages for style analysis
            const recentMessages = history.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content,
            }));
            
            const detectedStyle = await analyzeUserStyle(recentMessages, conversation.messageCount);
            
            // Update user preferences in background
            await updateCommunicationStyle(workspaceId, userRecord.id, detectedStyle);
            
            logger.info('[AI Chat] Communication style analyzed and updated', {
              workspaceId,
              userId: userRecord.id,
              messageCount: conversation.messageCount,
              style: `${detectedStyle.formality}/${detectedStyle.verbosity}/${detectedStyle.tone}`,
              confidence: detectedStyle.confidence,
            });
          } catch (err) {
            logger.warn('[AI Chat] Style analysis failed (non-blocking)', { err });
          }
        })();
      }

      // Detect URLs in the current user message and inject tool call hint
      const detectedUrls = detectUrls(message);
      let enhancedUserMessage = fullMessage;
      if (detectedUrls.length > 0) {
        const urlList = detectedUrls.join(', ');
        // Use a more forceful instruction to ensure tool is called
        enhancedUserMessage = `${fullMessage}\n\n[SYSTEM OVERRIDE - MANDATORY TOOL CALL]: User provided URL(s): ${urlList}\n\nYou are REQUIRED to call analyze_company_website immediately with these exact parameters:\n- Function: analyze_company_website\n- url: "${detectedUrls[0]}"\n- detailed: false\n\nCALL THIS TOOL NOW. Do NOT respond with text first. Do NOT ask permission. Execute the tool call before any other action. This is a system requirement, not optional.`;
        logger.info('[AI Chat Stream] URLs detected, forcing website analysis', { 
          urls: detectedUrls,
          originalMessage: message.slice(0, 100),
          conversationId: conversation.id 
        });
      } else {
        logger.debug('[AI Chat Stream] No URLs detected in message', { 
          message: message.slice(0, 100) 
        });
      }

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
        // Add current user message with URL detection hint if URLs found
        {
          role: 'user',
          content: enhancedUserMessage,
        },
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
      const totalTokensUsed = 0; // Track token usage for observability
      const wasResponseCached = false; // Track if response came from cache
      const ragResultsCount = 0; // Track RAG results count

      // Streaming with tool call loop
      let continueLoop = true;
      while (continueLoop && iterations < maxIterations) {
        iterations++;
        
        // Detect complex questions that need chain-of-thought reasoning
        const isComplexQuestion = detectComplexQuestion(message);
        const useChainOfThought = isComplexQuestion && iterations === 1;

        // Enhance system prompt for complex questions
        let enhancedMessages = messages;
        if (useChainOfThought) {
          // Inject chain-of-thought instruction for first iteration
          const enhancedSystemPrompt = systemPrompt + `

IMPORTANT: This is a complex question requiring deep analysis. Use chain-of-thought reasoning:
1. Break down the question into components
2. Consider multiple perspectives and trade-offs
3. Analyze implications and potential outcomes
4. Synthesize into a clear, actionable recommendation
Show your reasoning process naturally in your response.`;

          enhancedMessages = [
            { role: 'system', content: enhancedSystemPrompt },
            ...messages.slice(1), // Keep other messages
          ];

          logger.info('[AI Chat Stream] Using chain-of-thought reasoning', {
            message: message.slice(0, 50),
          });
        }

        const stream = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: enhancedMessages,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: tools.length > 0 ? 'auto' : undefined,
          temperature: useChainOfThought ? 0.7 : 0.5, // Slightly higher for creative reasoning
          max_tokens: useChainOfThought ? 2000 : 1500, // More tokens for complex reasoning
          frequency_penalty: 0.3,
          presence_penalty: 0.2,
          stream: true,
        });

        // Collect streamed response
        let currentContent = '';
        const currentToolCalls: Array<{
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

      // Track Neptune performance metrics
      trackNeptuneRequest(duration, {
        userId: currentUser.id,
        workspaceId,
        cached: wasResponseCached,
        tokensUsed: totalTokensUsed,
        ragResultsCount,
      });

      // Cache the response for similar future queries (async, non-blocking)
      if (!attachments || attachments.length === 0) {
        cacheResponse(message, fullResponse, workspaceId, {
          toolsUsed: toolCallsMade.map(tc => tc.name),
          metadata: { duration, conversationId: conversation.id },
        }).catch(err => logger.warn('[AI Chat Stream] Failed to cache response', { err }));
      }

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
      
      // Track Neptune error
      if (error instanceof Error) {
        trackNeptuneError(error, {
          workspaceId: '', // May not be available in error state
          duration,
        });
      }
      
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
