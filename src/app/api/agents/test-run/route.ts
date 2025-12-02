import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { getOpenAI } from '@/lib/ai-providers';
import { aiTools, executeTool, type ToolContext } from '@/lib/ai/tools';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Test run endpoint - tests agent configuration without creating the agent
 * Used by the Laboratory wizard to verify agents work before activation
 */

const testRunSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string(),
  tone: z.enum(['professional', 'friendly', 'concise']).optional(),
  capabilities: z.array(z.string()).optional(),
  systemPrompt: z.string().optional(),
  task: z.string().optional(), // Optional custom test task
});

/**
 * Map agent capabilities to tool names
 */
const CAPABILITY_TOOLS: Record<string, string[]> = {
  crm: ['search_leads', 'get_pipeline_summary', 'get_hot_leads'], // Read-only for test
  email: ['draft_email'], // Don't send emails in test
  calendar: ['get_upcoming_events'], // Read-only for test
  knowledge: ['search_knowledge', 'list_collections'], // Read-only for test
  web: [],
};

/**
 * Build system prompt for test run
 */
function buildTestSystemPrompt(config: {
  name: string;
  type: string;
  description?: string;
  tone?: string;
  capabilities?: string[];
  systemPrompt?: string;
}): string {
  if (config.systemPrompt) {
    return config.systemPrompt + '\n\nNOTE: This is a TEST RUN. Perform read-only operations to verify your capabilities work correctly.';
  }

  const tone = config.tone || 'professional';
  const toneDescriptions: Record<string, string> = {
    professional: 'formal, business-focused, and precise',
    friendly: 'warm, approachable, and conversational',
    concise: 'brief, direct, and efficient',
  };

  return `You are ${config.name}, an AI agent specialized in ${config.type} tasks.

Your communication style is ${toneDescriptions[tone] || 'professional'}.

${config.description || ''}

This is a TEST RUN to verify your configuration. Demonstrate your capabilities by:
1. Using your tools to fetch real data (if available)
2. Showing what you can do with that data
3. Providing a brief summary of your capabilities

Keep your response concise but demonstrate that you can access real data.`;
}

/**
 * Get read-only tools for test run
 */
function getTestTools(capabilities?: string[]): ChatCompletionTool[] {
  const caps = capabilities || [];
  const toolNames = new Set<string>();

  for (const capability of caps) {
    const tools = CAPABILITY_TOOLS[capability] || [];
    tools.forEach((t) => toolNames.add(t));
  }

  // If no capabilities, use safe defaults
  if (toolNames.size === 0) {
    ['get_pipeline_summary', 'get_upcoming_events', 'search_knowledge'].forEach(t => toolNames.add(t));
  }

  return aiTools.filter((tool) => {
    if (tool.type === 'function' && 'function' in tool) {
      return toolNames.has(tool.function.name);
    }
    return false;
  });
}

/**
 * POST: Test run an agent configuration
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const body = await request.json();

    // Validate input
    const validationResult = testRunSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const config = validationResult.data;

    logger.info('Agent test run started', {
      agentName: config.name,
      agentType: config.type,
      capabilities: config.capabilities,
      workspaceId,
    });

    try {
      const openai = getOpenAI();

      // Build tool context
      const toolContext: ToolContext = {
        workspaceId,
        userId: user.clerkUserId || user.id,
        userEmail: user.email || 'test@galaxyco.ai',
        userName: user.name || config.name,
      };

      // Build system prompt
      const systemPrompt = buildTestSystemPrompt(config);

      // Get test-safe tools
      const agentTools = getTestTools(config.capabilities);

      // Build test task
      const testTask = config.task || 
        `Demonstrate your capabilities as ${config.name}. ` +
        `Briefly show what you can do by checking available data ` +
        `(leads in the pipeline, upcoming events, knowledge base, etc.). ` +
        `Keep your response to 2-3 sentences summarizing what you found.`;

      // Initialize messages
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: testTask },
      ];

      // Call OpenAI
      let response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: agentTools.length > 0 ? agentTools : undefined,
        temperature: 0.7,
        max_tokens: 500, // Shorter for test runs
      });

      // Handle tool calls (max 2 iterations for test)
      const toolResults: Array<{ tool: string; success: boolean }> = [];
      let iterations = 0;
      const maxIterations = 2;

      while (response.choices[0]?.message?.tool_calls && iterations < maxIterations) {
        iterations++;
        const toolCalls = response.choices[0].message.tool_calls;

        messages.push(response.choices[0].message);

        for (const toolCall of toolCalls) {
          if (toolCall.type !== 'function') continue;
          
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

          logger.info('Test run executing tool', { tool: toolName });

          const result = await executeTool(toolName, toolArgs, toolContext);
          toolResults.push({ 
            tool: toolName, 
            success: (result as { success?: boolean })?.success ?? true 
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          tools: agentTools.length > 0 ? agentTools : undefined,
          temperature: 0.7,
          max_tokens: 500,
        });
      }

      const finalResponse = response.choices[0]?.message?.content || 'Test completed successfully.';
      const durationMs = Date.now() - startTime;

      logger.info('Agent test run completed', {
        agentName: config.name,
        durationMs,
        toolsUsed: toolResults.length,
      });

      return NextResponse.json({
        success: true,
        response: finalResponse,
        toolsUsed: toolResults,
        durationMs,
        message: `${config.name} is working correctly!`,
      });
    } catch (executionError) {
      const errorMessage = executionError instanceof Error ? executionError.message : 'Unknown error';
      
      logger.error('Agent test run failed', {
        agentName: config.name,
        error: errorMessage,
      });

      // Check for common issues
      if (errorMessage.includes('API key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI service not configured. Please check your API keys.',
            message: 'Test failed - AI service unavailable',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          message: 'Test failed - please check agent configuration',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return createErrorResponse(error, 'Test run error');
  }
}
