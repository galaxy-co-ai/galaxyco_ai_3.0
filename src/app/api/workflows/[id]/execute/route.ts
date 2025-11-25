import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';

// Temporary storage
const workflows = new Map<string, any>();
const executions = new Map<string, any>();

// Simple workflow execution engine
async function executeNode(node: any, input: any, context: any): Promise<any> {
  switch (node.type) {
    case 'trigger':
      return { success: true, output: input };

    case 'ai-text':
      // OpenAI text generation
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: node.data.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: node.data.prompt || input.prompt || '' },
        ],
        temperature: node.data.temperature || 0.7,
        max_tokens: node.data.maxTokens || 500,
      });
      return {
        success: true,
        output: {
          text: completion.choices[0]?.message?.content || '',
          usage: completion.usage,
        },
      };

    case 'conditional':
      // Simple conditional logic
      const condition = node.data.condition;
      const value = input[condition.field];
      const result = evaluateCondition(value, condition.operator, condition.value);
      return {
        success: true,
        output: { condition: result, ...input },
        nextPath: result ? 'true' : 'false',
      };

    case 'data-transform':
      // Transform data
      try {
        const transformed = node.data.script 
          ? eval(`(${node.data.script})`)(input)
          : input;
        return { success: true, output: transformed };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Transform failed' 
        };
      }

    case 'http-request':
      // HTTP request
      const response = await fetch(node.data.url, {
        method: node.data.method || 'GET',
        headers: node.data.headers || {},
        body: node.data.body ? JSON.stringify(node.data.body) : undefined,
      });
      const data = await response.json();
      return { success: response.ok, output: data };

    case 'delay':
      // Simple delay
      await new Promise(resolve => setTimeout(resolve, node.data.duration || 1000));
      return { success: true, output: input };

    default:
      return { success: true, output: input };
  }
}

function evaluateCondition(value: any, operator: string, compareValue: any): boolean {
  switch (operator) {
    case 'equals': return value === compareValue;
    case 'not_equals': return value !== compareValue;
    case 'greater_than': return value > compareValue;
    case 'less_than': return value < compareValue;
    case 'contains': return String(value).includes(String(compareValue));
    default: return false;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: workflowId } = await params;

    // Rate limit
    const rateLimitResult = await rateLimit(`workflow:${userId}`, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const workflow = workflows.get(workflowId);

    if (!workflow || workflow.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const input = body.input || {};

    // Create execution record
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: any = {
      id: executionId,
      workflowId,
      workspaceId,
      status: 'running',
      input,
      output: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      duration: 0,
      nodeExecutions: [],
    };

    executions.set(executionId, execution);

    // Execute workflow
    const startTime = Date.now();
    try {
      const nodes = workflow.nodes || [];
      const edges = workflow.edges || [];

      // Find start node (trigger)
      const startNode = nodes.find((n: any) => n.type === 'trigger');
      if (!startNode) {
        throw new Error('No trigger node found');
      }

      // Simple sequential execution (for MVP)
      let currentData = input;
      const nodeResults = [];

      for (const node of nodes) {
        const nodeStart = Date.now();
        const result = await executeNode(node, currentData, { workspaceId });
        const nodeDuration = Date.now() - nodeStart;

        nodeResults.push({
          nodeId: node.id,
          nodeType: node.type,
          status: result.success ? 'completed' : 'failed',
          input: currentData,
          output: result.output,
          error: result.error,
          duration: nodeDuration,
        });

        if (!result.success) {
          throw new Error(result.error || 'Node execution failed');
        }

        currentData = result.output;
      }

      const duration = Date.now() - startTime;

      // Update execution
      execution.status = 'completed';
      execution.output = currentData;
      execution.completedAt = new Date().toISOString();
      execution.duration = duration;
      execution.nodeExecutions = nodeResults;

      // Update workflow stats
      workflow.executionCount += 1;
      workflow.lastExecutedAt = new Date().toISOString();
      workflows.set(workflowId, workflow);

      return NextResponse.json({
        executionId: execution.id,
        status: 'completed',
        duration,
        output: currentData,
        nodeExecutions: nodeResults,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Execution failed';
      execution.completedAt = new Date().toISOString();
      execution.duration = duration;

      return NextResponse.json({
        executionId: execution.id,
        status: 'failed',
        error: execution.error,
        duration,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}


