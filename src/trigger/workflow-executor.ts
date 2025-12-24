import { task, schedules, metadata, logger as triggerLogger } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { agents, agentExecutions, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import OpenAI from "openai";
import { aiTools, executeTool, type ToolContext } from "@/lib/ai/tools";
import type { ToolExecutionPart, STREAMS } from "./streams";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Map agent capabilities to tool names
 */
const CAPABILITY_TOOLS: Record<string, string[]> = {
  crm: ["create_lead", "search_leads", "update_lead_stage", "create_contact", "get_hot_leads", "get_pipeline_summary"],
  email: ["draft_email", "send_email"],
  calendar: ["schedule_meeting", "get_upcoming_events"],
  knowledge: ["search_knowledge", "create_document"],
  web: [], // Would need web search implementation
};

/**
 * Get system prompt for an agent based on its config and template
 */
function buildAgentSystemPrompt(agent: {
  name: string;
  type: string;
  description: string | null;
  config: unknown;
}): string {
  const config = agent.config as {
    systemPrompt?: string;
    tone?: "professional" | "friendly" | "concise";
    capabilities?: string[];
  } | null;

  // Use custom system prompt if provided
  if (config?.systemPrompt) {
    return config.systemPrompt;
  }

  // Generate default prompt based on agent type and tone
  const tone = config?.tone || "professional";
  const toneDescriptions = {
    professional: "formal, business-focused, and precise",
    friendly: "warm, approachable, and conversational",
    concise: "brief, direct, and efficient",
  };

  return `You are ${agent.name}, an AI agent specialized in ${agent.type} tasks.

Your communication style is ${toneDescriptions[tone]}.

${agent.description || ""}

You have access to various tools to complete your tasks. Use them proactively to gather information and take action.

When completing tasks:
1. Analyze the input to understand what's needed
2. Use available tools to gather necessary information
3. Take appropriate actions based on your analysis
4. Provide a clear summary of what you accomplished

Be thorough but efficient. Complete the task autonomously without asking clarifying questions unless absolutely necessary.`;
}

/**
 * Get tools for an agent based on its capabilities
 */
function getAgentTools(agent: { config: unknown }) {
  const config = agent.config as {
    capabilities?: string[];
    tools?: string[];
  } | null;

  // If specific tools are configured, use those
  if (config?.tools && config.tools.length > 0) {
    return aiTools.filter((tool) => {
      if (tool.type === "function" && "function" in tool) {
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

  // If no capabilities specified, give access to common tools
  if (toolNames.size === 0) {
    return aiTools.filter((tool) => {
      if (tool.type === "function" && "function" in tool) {
        // Default safe tools
        const safeTool = ["search_leads", "get_pipeline_summary", "get_hot_leads", "get_upcoming_events", "search_knowledge"];
        return safeTool.includes(tool.function.name);
      }
      return false;
    });
  }

  return aiTools.filter((tool) => {
    if (tool.type === "function" && "function" in tool) {
      return toolNames.has(tool.function.name);
    }
    return false;
  });
}

/**
 * Execute Agent/Workflow Task
 * Runs an AI agent with the given inputs using real AI
 */
export const executeAgentTask = task({
  id: "execute-agent",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: {
    agentId: string;
    workspaceId: string;
    inputs?: Record<string, unknown>;
    triggeredBy?: string;
    executionId?: string;
    testMode?: boolean;
  }) => {
    const { agentId, workspaceId, inputs = {}, executionId, testMode = false } = payload;

    // Get the agent
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.workspaceId, workspaceId)),
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    if (!testMode && agent.status !== "active") {
      return { success: false, error: `Agent is not active (status: ${agent.status})` };
    }

    // Resolve triggeredBy user (fallback to agent creator)
    const triggeredByUserId = payload.triggeredBy || agent.createdBy;

    // Use existing execution if provided, otherwise create one
    let executionIdToUse = executionId;
    if (executionIdToUse) {
      await db
        .update(agentExecutions)
        .set({
          status: "running",
          input: inputs,
          startedAt: new Date(),
        })
        .where(eq(agentExecutions.id, executionIdToUse));
    } else {
      const [execution] = await db
        .insert(agentExecutions)
        .values({
          workspaceId,
          agentId,
          status: "running",
          input: inputs,
          triggeredBy: triggeredByUserId,
          startedAt: new Date(),
        })
        .returning();
      executionIdToUse = execution.id;
    }

    logger.info("Agent execution started", {
      executionId: executionIdToUse,
      agentId,
      agentName: agent.name,
      workspaceId,
    });

    const startTime = Date.now();

    try {
      // Check if OpenAI is configured
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }

      // Get agent creator for tool context
      const creator = triggeredByUserId
        ? await db.query.users.findFirst({
            where: eq(users.id, triggeredByUserId),
          })
        : null;

      // Build tool context
      const toolContext: ToolContext = {
        workspaceId,
        userId: creator?.clerkUserId || creator?.id || agent.createdBy,
        userEmail: creator?.email || "agent@galaxyco.ai",
        userName: agent.name,
      };

      // Build system prompt
      const systemPrompt = buildAgentSystemPrompt(agent);

      // Get tools for this agent
      const agentTools = getAgentTools(agent);

      // Build user message from inputs
      let userMessage = "Execute your task.";
      if (inputs && Object.keys(inputs).length > 0) {
        if (inputs.task) {
          userMessage = String(inputs.task);
        } else if (inputs.message) {
          userMessage = String(inputs.message);
        } else {
          userMessage = `Execute your task with these inputs:\n${JSON.stringify(inputs, null, 2)}`;
        }
      }

      // Call OpenAI with streaming
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ];

      // Handle tool calls in a loop with streaming
      const toolResults: Array<{ tool: string; result: unknown }> = [];
      let iterations = 0;
      const maxIterations = 5; // Prevent infinite loops
      let finalResponse = "";
      let hasToolCalls = true;

      // Helper to emit tool execution events to the realtime stream
      // Tool events are stored in metadata for realtime UI updates
      const emitToolEvent = async (event: ToolExecutionPart) => {
        try {
          // Get current tool events array and append the new event
          // This is available in the frontend via run.metadata.toolEvents
          const currentToolsRaw = metadata.get("toolEvents");
          const currentTools = Array.isArray(currentToolsRaw) ? currentToolsRaw : [];
          const eventData = {
            type: event.type,
            toolName: event.toolName,
            args: event.args ?? null,
            result: event.result ?? null,
            error: event.error ?? null,
            timestamp: event.timestamp,
          };
          // Cast to any to bypass strict typing - metadata accepts JSON-serializable data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          metadata.set("toolEvents", [...currentTools, eventData] as any);
        } catch (err) {
          triggerLogger.warn("Failed to emit tool event", { err });
        }
      };

      while (hasToolCalls && iterations <= maxIterations) {
        // Create streaming completion
        const openaiStream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools: agentTools.length > 0 ? agentTools : undefined,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        });

        // Register the OpenAI stream with Trigger.dev's realtime API
        // This "tees" the stream - we can still iterate over it while chunks
        // are forwarded to subscribers via useRealtimeRunWithStreams
        const teedStream = await metadata.stream("openai", openaiStream);

        // Collect response and stream to frontend via metadata.stream
        let responseContent = "";
        const currentToolCalls: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall[] = [];
        
        for await (const chunk of teedStream) {
          const delta = chunk.choices[0]?.delta;
          
          // Handle content streaming - chunks are automatically forwarded
          // to frontend via the registered stream above
          if (delta?.content) {
            responseContent += delta.content;
          }
          
          // Collect tool calls from the stream
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.index !== undefined) {
                if (!currentToolCalls[tc.index]) {
                  currentToolCalls[tc.index] = {
                    index: tc.index,
                    id: tc.id || "",
                    type: "function",
                    function: { name: "", arguments: "" },
                  };
                }
                if (tc.id) currentToolCalls[tc.index].id = tc.id;
                if (tc.function?.name) currentToolCalls[tc.index].function!.name += tc.function.name;
                if (tc.function?.arguments) currentToolCalls[tc.index].function!.arguments += tc.function.arguments;
              }
            }
          }
        }

        // Check if we have tool calls to execute
        const validToolCalls = currentToolCalls.filter(tc => tc?.function?.name);
        
        if (validToolCalls.length > 0 && iterations < maxIterations) {
          iterations++;
          
          // Add assistant message with tool calls
          messages.push({
            role: "assistant",
            content: responseContent || null,
            tool_calls: validToolCalls.map(tc => ({
              id: tc.id || `call_${Math.random().toString(36).substr(2, 9)}`,
              type: "function" as const,
              function: {
                name: tc.function?.name || "",
                arguments: tc.function?.arguments || "{}",
              },
            })),
          });

          // Execute each tool call with realtime event emission
          for (const toolCall of validToolCalls) {
            const toolName = toolCall.function?.name || "";
            if (!toolName) continue; // Skip if no tool name
            const toolArgs = JSON.parse(toolCall.function?.arguments || "{}");

            // Emit tool_start event for realtime UI
            await emitToolEvent({
              type: "tool_start",
              toolName,
              args: toolArgs,
              timestamp: new Date().toISOString(),
            });

            logger.info("Agent executing tool", {
              executionId: executionIdToUse,
              tool: toolName,
              args: toolArgs,
            });

            try {
              const result = await executeTool(toolName, toolArgs, toolContext);
              toolResults.push({ tool: toolName, result });

              // Emit tool_complete event for realtime UI
              await emitToolEvent({
                type: "tool_complete",
                toolName,
                result,
                timestamp: new Date().toISOString(),
              });

              // Add tool result to messages
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id || `call_${Math.random().toString(36).substr(2, 9)}`,
                content: JSON.stringify(result),
              });
            } catch (toolError) {
              const errorMessage = toolError instanceof Error ? toolError.message : "Unknown error";
              
              // Emit tool_error event for realtime UI
              await emitToolEvent({
                type: "tool_error",
                toolName,
                error: errorMessage,
                timestamp: new Date().toISOString(),
              });

              toolResults.push({ tool: toolName, result: { error: errorMessage } });
              
              // Add error as tool result so the LLM can recover
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id || `call_${Math.random().toString(36).substr(2, 9)}`,
                content: JSON.stringify({ error: errorMessage }),
              });
            }
          }
        } else {
          // No more tool calls, we have the final response
          hasToolCalls = false;
          finalResponse = responseContent || "Task completed.";
        }
      }

      // If we hit max iterations, use the last response
      if (iterations >= maxIterations && !finalResponse) {
        finalResponse = "Task completed after maximum iterations.";
      }
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
        inputs,
      };

      // Update execution record with success
      await db
        .update(agentExecutions)
        .set({
          status: "completed",
          output: results,
          completedAt: new Date(),
          durationMs,
        })
        .where(eq(agentExecutions.id, executionIdToUse));

      // Update agent stats
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

      logger.info("Agent execution completed", {
        executionId: executionIdToUse,
        agentId,
        durationMs,
        toolsUsed: toolResults.length,
      });

      return {
        success: true,
        executionId: executionIdToUse,
        results,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const durationMs = Date.now() - startTime;

      // Update execution record with error
      await db
        .update(agentExecutions)
        .set({
          status: "failed",
          error: { message: errorMessage },
          completedAt: new Date(),
          durationMs,
        })
        .where(eq(agentExecutions.id, executionIdToUse));

      logger.error("Agent execution failed", {
        executionId: executionIdToUse,
        agentId,
        error: errorMessage,
        durationMs,
      });

      return {
        success: false,
        executionId: executionIdToUse,
        error: errorMessage,
      };
    }
  },
});

/**
 * Process Active Agents Task
 * Checks all active agents and triggers any pending scheduled executions
 */
export const processActiveAgentsTask = task({
  id: "process-active-agents",
  run: async (payload: { workspaceId?: string }) => {
    const { workspaceId } = payload;

    // Get all active agents, optionally filtered by workspace
    const conditions = [eq(agents.status, "active")];
    if (workspaceId) {
      conditions.push(eq(agents.workspaceId, workspaceId));
    }

    const activeAgents = await db.query.agents.findMany({
      where: and(...conditions),
    });

    logger.info("Processing active agents", {
      count: activeAgents.length,
      workspaceId: workspaceId || "all",
    });

    // For now, just return the count - scheduled execution would need
    // a separate scheduling mechanism (e.g., using agentSchedules table)
    return {
      success: true,
      activeAgentCount: activeAgents.length,
      agents: activeAgents.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        executionCount: a.executionCount,
        lastExecutedAt: a.lastExecutedAt,
      })),
    };
  },
});

/**
 * Scheduled Agent Health Check
 * Runs hourly to monitor agent status and executions
 */
export const scheduledAgentHealthCheck = schedules.task({
  id: "scheduled-agent-health-check",
  cron: "0 * * * *", // Every hour
  run: async () => {
    logger.info("Running scheduled agent health check");

    // Get stats on all agents
    const allAgents = await db.query.agents.findMany();

    const stats = {
      total: allAgents.length,
      active: allAgents.filter((a) => a.status === "active").length,
      draft: allAgents.filter((a) => a.status === "draft").length,
      paused: allAgents.filter((a) => a.status === "paused").length,
      totalExecutions: allAgents.reduce((sum, a) => sum + (a.executionCount || 0), 0),
    };

    logger.info("Agent health check completed", stats);

    return {
      success: true,
      stats,
      checkedAt: new Date().toISOString(),
    };
  },
});
