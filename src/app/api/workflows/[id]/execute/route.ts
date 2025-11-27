import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, agentExecutionLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { getOpenAI } from '@/lib/ai-providers';

const executeSchema = z.object({
  input: z.record(z.any()).optional(),
  testMode: z.boolean().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await request.json();

    const validationResult = executeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { input, testMode } = validationResult.data;

    // Get the workflow/agent
    const agent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Create execution log
    const [executionLog] = await db
      .insert(agentExecutionLogs)
      .values({
        agentId: agent.id,
        workspaceId,
        triggeredBy: user.id,
        status: 'running',
        input: input || {},
      })
      .returning();

    logger.info('Workflow execution started', { 
      executionId: executionLog.id, 
      agentId: agent.id, 
      workspaceId,
      testMode 
    });

    try {
      // Get agent config
      const config = agent.config as {
        nodes?: Array<{ id: string; type: string; title: string; description: string }>;
        systemPrompt?: string;
        trigger?: { type: string; config: Record<string, unknown> };
      } | null;

      const nodes = config?.nodes || [];
      const systemPrompt = config?.systemPrompt || `You are ${agent.name}, an AI agent. ${agent.description || ''}`;

      // Build execution steps based on nodes
      const executionSteps: Array<{ step: string; status: string; result?: string }> = [];

      // Process each node in sequence
      for (const node of nodes) {
        if (node.type === 'llm') {
          // Execute LLM node
          const openai = getOpenAI();
          const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Execute step: ${node.title}\n\nDescription: ${node.description}\n\nInput: ${JSON.stringify(input || {})}` },
            ],
            max_tokens: 500,
          });

          executionSteps.push({
            step: node.title,
            status: 'completed',
            result: completion.choices[0]?.message?.content || 'No response',
          });
        } else {
          // For other node types, simulate execution
          executionSteps.push({
            step: node.title,
            status: 'completed',
            result: `Executed ${node.type}: ${node.description}`,
          });
        }
      }

      const durationMs = Date.now() - startTime;

      // Update execution log with success
      const [updatedLog] = await db
        .update(agentExecutionLogs)
        .set({
          status: 'completed',
          output: { steps: executionSteps },
          durationMs,
          completedAt: new Date(),
        })
        .where(eq(agentExecutionLogs.id, executionLog.id))
        .returning();

      // Update agent execution count
      await db
        .update(agents)
        .set({
          executionCount: agent.executionCount + 1,
          lastExecutedAt: new Date(),
        })
        .where(eq(agents.id, agent.id));

      logger.info('Workflow execution completed', { 
        executionId: executionLog.id, 
        durationMs,
        stepsCount: executionSteps.length 
      });

      return NextResponse.json({
        executionId: updatedLog.id,
        status: 'completed',
        durationMs,
        steps: executionSteps,
        output: executionSteps[executionSteps.length - 1]?.result || null,
      });
    } catch (executionError) {
      const durationMs = Date.now() - startTime;
      
      // Update execution log with failure
      await db
        .update(agentExecutionLogs)
        .set({
          status: 'failed',
          error: { message: executionError instanceof Error ? executionError.message : 'Unknown error' },
          durationMs,
          completedAt: new Date(),
        })
        .where(eq(agentExecutionLogs.id, executionLog.id));

      throw executionError;
    }
  } catch (error) {
    return createErrorResponse(error, 'Execute workflow error');
  }
}
