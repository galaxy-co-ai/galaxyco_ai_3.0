/**
 * Workflow Builder Module
 * 
 * Allows Neptune to create automations from natural language descriptions.
 * Converts user intent into automation rules.
 */

import { db } from '@/lib/db';
import { automationRules } from '@/db/schema';
import { getOpenAI } from '@/lib/ai-providers';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

// Database trigger types (from automationTriggerTypeEnum)
type DBTriggerType = 'lead_created' | 'lead_stage_changed' | 'deal_created' | 'deal_stage_changed' | 
                     'contact_created' | 'task_completed' | 'email_opened' | 'form_submitted' | 
                     'scheduled' | 'webhook';

export interface WorkflowDefinition {
  name: string;
  description: string;
  trigger: {
    type: 'lead_stage_change' | 'task_due' | 'schedule' | 'manual' | 'webhook';
    config: Record<string, unknown>;
  };
  actions: Array<{
    type: 'send_email' | 'create_task' | 'update_lead' | 'send_notification' | 'wait';
    config: Record<string, unknown>;
  }>;
}

const workflowSchema = z.object({
  name: z.string(),
  description: z.string(),
  trigger: z.object({
    type: z.enum(['lead_stage_change', 'task_due', 'schedule', 'manual', 'webhook']),
    config: z.record(z.unknown()),
  }),
  actions: z.array(z.object({
    type: z.enum(['send_email', 'create_task', 'update_lead', 'send_notification', 'wait']),
    config: z.record(z.unknown()),
  })),
});

// ============================================================================
// AI WORKFLOW GENERATION
// ============================================================================

/**
 * Parse natural language into a workflow definition
 */
export async function parseWorkflowFromDescription(
  description: string,
  workspaceContext?: string
): Promise<WorkflowDefinition | null> {
  try {
    const openai = getOpenAI();

    const systemPrompt = `You are an automation expert. Convert natural language descriptions into workflow definitions.

Available triggers:
- lead_stage_change: When a lead moves between stages (from/to config)
- task_due: When a task becomes due
- schedule: Run on a schedule (cron expression)
- manual: Triggered manually
- webhook: External webhook trigger

Available actions:
- send_email: Send an email (to, subject, body)
- create_task: Create a new task (title, description, dueDate, assigneeId)
- update_lead: Update lead properties (leadId, updates)
- send_notification: Send in-app notification (message, type)
- wait: Pause for a duration (minutes/hours/days)

Respond with ONLY valid JSON matching this schema:
{
  "name": "string",
  "description": "string",
  "trigger": { "type": "string", "config": {} },
  "actions": [{ "type": "string", "config": {} }]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Create a workflow for: "${description}"${workspaceContext ? `\n\nContext: ${workspaceContext}` : ''}` 
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const validated = workflowSchema.parse(parsed);

    logger.info('[Workflow Builder] Parsed workflow from description', {
      name: validated.name,
      triggerType: validated.trigger.type,
      actionCount: validated.actions.length,
    });

    return validated;
  } catch (error) {
    logger.error('[Workflow Builder] Failed to parse workflow', error);
    return null;
  }
}

// ============================================================================
// WORKFLOW CRUD
// ============================================================================

/**
 * Create an automation rule from a workflow definition
 */
export async function createAutomation(
  workspaceId: string,
  workflow: WorkflowDefinition,
  createdBy: string
): Promise<string> {
  try {
    // Map AI trigger types to database enum
    const triggerTypeMap: Record<string, DBTriggerType> = {
      lead_stage_change: 'lead_stage_changed',
      task_due: 'task_completed', // Map task_due to task_completed
      schedule: 'scheduled',
      manual: 'webhook', // No manual trigger, use webhook as closest
      webhook: 'webhook',
    };

    // Map actions to database format
    const dbActions = workflow.actions.map(action => ({
      type: action.type,
      config: action.config,
    }));

    const [automation] = await db.insert(automationRules).values({
      workspaceId,
      name: workflow.name,
      description: workflow.description,
      status: 'draft',
      triggerType: triggerTypeMap[workflow.trigger.type] || 'manual',
      triggerConfig: workflow.trigger.config,
      actions: dbActions,
      createdBy,
    }).returning({ id: automationRules.id });

    logger.info('[Workflow Builder] Automation created', {
      id: automation.id,
      name: workflow.name,
    });

    return automation.id;
  } catch (error) {
    logger.error('[Workflow Builder] Failed to create automation', error);
    throw new Error('Failed to create automation');
  }
}

/**
 * Create automation from natural language and return confirmation
 */
export async function createAutomationFromChat(
  workspaceId: string,
  description: string,
  createdBy?: string
): Promise<{
  success: boolean;
  automationId?: string;
  workflow?: WorkflowDefinition;
  message: string;
}> {
  // Parse the description into a workflow
  const workflow = await parseWorkflowFromDescription(description);
  
  if (!workflow) {
    return {
      success: false,
      message: 'I couldn\'t understand that automation. Could you describe it differently? For example: "When a lead reaches the qualified stage, send them a welcome email"',
    };
  }

  // Create the automation (use a placeholder createdBy if not provided)
  try {
    // If no createdBy, we'll need to get the first workspace member
    let creator = createdBy;
    if (!creator) {
      const { workspaceMembers } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const member = await db.query.workspaceMembers.findFirst({
        where: eq(workspaceMembers.workspaceId, workspaceId),
      });
      creator = member?.userId;
    }
    
    if (!creator) {
      return {
        success: false,
        workflow,
        message: 'Unable to determine the creator for this automation.',
      };
    }

    const automationId = await createAutomation(workspaceId, workflow, creator);
    
    return {
      success: true,
      automationId,
      workflow,
      message: `Created automation "${workflow.name}". It will ${describeTrigger(workflow.trigger)} and ${describeActions(workflow.actions)}. The automation is saved as a draft - activate it when ready!`,
    };
  } catch (error) {
    return {
      success: false,
      workflow,
      message: 'I understood your automation but couldn\'t save it. Please try again.',
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function describeTrigger(trigger: WorkflowDefinition['trigger']): string {
  switch (trigger.type) {
    case 'lead_stage_change':
      const from = trigger.config.fromStage as string | undefined;
      const to = trigger.config.toStage as string | undefined;
      if (from && to) return `trigger when a lead moves from ${from} to ${to}`;
      if (to) return `trigger when a lead enters the ${to} stage`;
      return 'trigger on lead stage changes';
    case 'task_due':
      return 'trigger when a task becomes due';
    case 'schedule':
      return `run on schedule (${trigger.config.schedule || 'daily'})`;
    case 'manual':
      return 'run when manually triggered';
    case 'webhook':
      return 'trigger from external webhook';
    default:
      return 'trigger based on your conditions';
  }
}

function describeActions(actions: WorkflowDefinition['actions']): string {
  const descriptions = actions.map(action => {
    switch (action.type) {
      case 'send_email':
        return 'send an email';
      case 'create_task':
        return 'create a task';
      case 'update_lead':
        return 'update the lead';
      case 'send_notification':
        return 'send a notification';
      case 'wait':
        return 'wait';
      default:
        return 'perform an action';
    }
  });

  if (descriptions.length === 1) return descriptions[0];
  if (descriptions.length === 2) return descriptions.join(' and ');
  return descriptions.slice(0, -1).join(', ') + ', and ' + descriptions[descriptions.length - 1];
}

// ============================================================================
// WORKFLOW TEMPLATES
// ============================================================================

export const workflowTemplates: Record<string, WorkflowDefinition> = {
  welcomeNewLead: {
    name: 'Welcome New Lead',
    description: 'Send a welcome email when a new lead is created',
    trigger: {
      type: 'lead_stage_change',
      config: { toStage: 'new' },
    },
    actions: [
      {
        type: 'send_email',
        config: {
          subject: 'Welcome! We\'re excited to connect',
          body: 'Thanks for your interest. We\'d love to learn more about how we can help you.',
        },
      },
    ],
  },
  followUpQualified: {
    name: 'Follow Up Qualified Leads',
    description: 'Create a follow-up task when a lead is qualified',
    trigger: {
      type: 'lead_stage_change',
      config: { toStage: 'qualified' },
    },
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Follow up with qualified lead',
          description: 'Schedule a discovery call',
          dueInDays: 1,
        },
      },
    ],
  },
  closedWonCelebration: {
    name: 'Celebrate Closed Won',
    description: 'Send celebration notification when a deal is won',
    trigger: {
      type: 'lead_stage_change',
      config: { toStage: 'won' },
    },
    actions: [
      {
        type: 'send_notification',
        config: {
          message: '🎉 Deal closed! Great work!',
          type: 'success',
        },
      },
    ],
  },
};
