import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, agentExecutions, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { getOpenAI } from '@/lib/ai-providers';
import { aiTools, executeTool, type ToolContext } from '@/lib/ai/tools';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

const runAgentSchema = z.object({
  task: z.string().optional(),
  message: z.string().optional(),
  inputs: z.record(z.unknown()).optional(),
  testMode: z.boolean().default(false),
});

/**
 * Map agent capabilities to tool names
 */
const CAPABILITY_TOOLS: Record<string, string[]> = {
  crm: ['create_lead', 'search_leads', 'update_lead_stage', 'create_contact', 'get_hot_leads', 'get_pipeline_summary', 'add_note'],
  email: ['draft_email', 'send_email'],
  calendar: ['schedule_meeting', 'get_upcoming_events'],
  knowledge: ['search_knowledge', 'create_document', 'generate_document', 'list_collections'],
  web: [], // Would need web search implementation
};

/**
 * Build system prompt based on agent configuration
 */
function buildAgentSystemPrompt(agent: {
  name: string;
  type: string;
  description: string | null;
  config: unknown;
}): string {
  const config = agent.config as {
    systemPrompt?: string;
    tone?: 'professional' | 'friendly' | 'concise';
    capabilities?: string[];
  } | null;

  // Use custom system prompt if provided
  if (config?.systemPrompt) {
    return config.systemPrompt;
  }

  // Generate default prompt based on agent type and tone
  const tone = config?.tone || 'professional';
  const toneDescriptions = {
    professional: 'formal, business-focused, and precise',
    friendly: 'warm, approachable, and conversational',
    concise: 'brief, direct, and efficient',
  };

  const capabilityDescriptions: Record<string, string> = {
    crm: 'managing leads, contacts, and sales pipeline',
    email: 'drafting and sending emails',
    calendar: 'scheduling meetings and managing calendar',
    knowledge: 'searching and creating documents in the knowledge base',
    web: 'searching the web for information',
  };

  const capabilities = config?.capabilities || [];
  const capDesc = capabilities
    .map(cap => capabilityDescriptions[cap])
    .filter(Boolean)
    .join(', ');

  return `You are ${agent.name}, an AI agent specialized in ${agent.type} tasks.

Your communication style is ${toneDescriptions[tone]}.

${agent.description || ''}

${capDesc ? `You have capabilities for: ${capDesc}.` : ''}

You have access to various tools to complete your tasks. Use them proactively to gather information and take action on real data.

When completing tasks:
1. Analyze the input to understand what's needed
2. Use available tools to gather necessary information from the database
3. Take appropriate actions based on your analysis
4. Provide a clear summary of what you accomplished

Be thorough but efficient. Complete the task autonomously without asking clarifying questions unless absolutely necessary.
Always use the tools to interact with real data - do not make up or simulate responses.`;
}

/**
 * Get tools for an agent based on its capabilities
 */
function getAgentTools(agent: { config: unknown }): ChatCompletionTool[] {
  const config = agent.config as {
    capabilities?: string[];
    tools?: string[];
  } | null;

  // If specific tools are configured, use those
  if (config?.tools && config.tools.length > 0) {
    return aiTools.filter((tool) => {
      if (tool.type === 'function' && 'function' in tool) {
        return config.tools!.includes(tool.function.name);
      }
      return false;
    });
  }

  // Otherwise, derive tools from capabilities
  const capabilities = config?.capabilities || [];
  const toolNames = new Set<string>();

  for (const capability of capabilities) {
    const tools = CAPABILITY_TOOLS[capability] || [];
    tools.forEach((t) => toolNames.add(t));
  }

  // If no capabilities specified, give access to common read-only tools
  if (toolNames.size === 0) {
    return aiTools.filter((tool) => {
      if (tool.type === 'function' && 'function' in tool) {
        const safeTools = ['search_leads', 'get_pipeline_summary', 'get_hot_leads', 'get_upcoming_events', 'search_knowledge'];
        return safeTools.includes(tool.function.name);
      }
      return false;
    });
  }

  return aiTools.filter((tool) => {
    if (tool.type === 'function' && 'function' in tool) {
      return toolNames.has(tool.function.name);
    }
    return false;
  });
}

/**
 * POST: Run an agent with optional task/message
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: agentId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = runAgentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { task, message, inputs, testMode } = validationResult.data;

    // Get the agent
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

    // Check agent status (allow running in test mode even if draft)
    if (!testMode && agent.status !== 'active') {
      return NextResponse.json(
        { error: `Agent is not active (status: ${agent.status})` },
        { status: 400 }
      );
    }

    // Create execution record
    const [execution] = await db
      .insert(agentExecutions)
      .values({
        workspaceId,
        agentId,
        status: 'running',
        input: { task, message, ...inputs },
        triggeredBy: user.id,
        startedAt: new Date(),
      })
      .returning();

    logger.info('Agent run started', {
      executionId: execution.id,
      agentId,
      agentName: agent.name,
      workspaceId,
      testMode,
    });

    try {
      // Check if OpenAI is configured
      const openai = getOpenAI();

      // Build tool context
      const toolContext: ToolContext = {
        workspaceId,
        userId: user.clerkUserId || user.id,
        userEmail: user.email || 'agent@galaxyco.ai',
        userName: user.firstName || agent.name,
      };

      // Build system prompt
      const systemPrompt = buildAgentSystemPrompt(agent);

      // Get tools for this agent
      const agentTools = getAgentTools(agent);

      // Build user message from task/message/inputs
      let userMessage = 'Execute your task.';
      if (task) {
        userMessage = task;
      } else if (message) {
        userMessage = message;
      } else if (inputs && Object.keys(inputs).length > 0) {
        userMessage = `Execute your task with these inputs:\n${JSON.stringify(inputs, null, 2)}`;
      }

      // Initialize messages
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];

      // Call OpenAI
      let response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: agentTools.length > 0 ? agentTools : undefined,
        temperature: 0.7,
        max_tokens: 2000,
      });

      // Handle tool calls in a loop
      const toolResults: Array<{ tool: string; args: unknown; result: unknown }> = [];
      let iterations = 0;
      const maxIterations = 5;

      while (response.choices[0]?.message?.tool_calls && iterations < maxIterations) {
        iterations++;
        const toolCalls = response.choices[0].message.tool_calls;

        // Add assistant message with tool calls
        messages.push(response.choices[0].message);

        // Execute each tool call
        for (const toolCall of toolCalls) {
          if (toolCall.type !== 'function') continue;
          
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

          logger.info('Agent executing tool', {
            executionId: execution.id,
            tool: toolName,
            args: toolArgs,
          });

          // Execute the tool with real database operations
          const result = await executeTool(toolName, toolArgs, toolContext);
          toolResults.push({ tool: toolName, args: toolArgs, result });

          // Add tool result to messages
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        // Get next response
        response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          tools: agentTools.length > 0 ? agentTools : undefined,
          temperature: 0.7,
          max_tokens: 2000,
        });
      }

      // Get final response content
      const finalResponse = response.choices[0]?.message?.content || 'Task completed.';
      const durationMs = Date.now() - startTime;

      // Build results
      const results = {
        agentName: agent.name,
        agentType: agent.type,
        executedAt: new Date().toISOString(),
        durationMs,
        response: finalResponse,
        toolsUsed: toolResults.map((tr) => tr.tool),
        toolResults,
        iterations,
        testMode,
      };

      // Update execution record with success
      await db
        .update(agentExecutions)
        .set({
          status: 'completed',
          output: results,
          completedAt: new Date(),
          durationMs,
        })
        .where(eq(agentExecutions.id, execution.id));

      // Update agent stats (not in test mode)
      if (!testMode) {
        await db
          .update(agents)
          .set({
            executionCount: (agent.executionCount || 0) + 1,
            lastExecutedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(agents.id, agentId));
      }

      logger.info('Agent run completed', {
        executionId: execution.id,
        agentId,
        durationMs,
        toolsUsed: toolResults.length,
        testMode,
      });

      return NextResponse.json({
        success: true,
        executionId: execution.id,
        response: finalResponse,
        toolsUsed: toolResults.map((tr) => tr.tool),
        toolResults: toolResults.map((tr) => ({
          tool: tr.tool,
          success: (tr.result as { success?: boolean })?.success ?? true,
          message: (tr.result as { message?: string })?.message,
        })),
        durationMs,
        testMode,
      });
    } catch (executionError) {
      const durationMs = Date.now() - startTime;
      const errorMessage = executionError instanceof Error ? executionError.message : 'Unknown error';

      // Update execution record with error
      await db
        .update(agentExecutions)
        .set({
          status: 'failed',
          error: { message: errorMessage },
          completedAt: new Date(),
          durationMs,
        })
        .where(eq(agentExecutions.id, execution.id));

      logger.error('Agent run failed', {
        executionId: execution.id,
        agentId,
        error: errorMessage,
        durationMs,
      });

      return NextResponse.json(
        {
          success: false,
          executionId: execution.id,
          error: errorMessage,
          durationMs,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return createErrorResponse(error, 'Run agent error');
  }
}
