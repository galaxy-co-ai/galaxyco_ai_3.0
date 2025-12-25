/**
 * Neptune Agentic Action Framework
 * 
 * Enables Neptune to proactively offer and execute tasks with proper guardrails:
 * - Drafting emails and messages
 * - Preparing reports and summaries
 * - Queuing follow-up actions
 * - Managing leads and contacts
 * 
 * Key principle: Offer → Review → Confirm → Execute
 * Neptune offers to help, user confirms, Neptune acts.
 */

import { db } from '@/lib/db';
import { prospects, contacts, tasks, calendarEvents } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getOpenAI } from '@/lib/ai-providers';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Types of actions Neptune can offer to take
 */
export type ActionType = 
  | 'draft_email'
  | 'draft_message'
  | 'create_task'
  | 'schedule_followup'
  | 'update_lead'
  | 'prepare_report'
  | 'send_reminder'
  | 'create_summary'
  | 'batch_update';

/**
 * Risk level of an action
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Status of a queued action
 */
export type ActionStatus = 'pending' | 'approved' | 'executed' | 'rejected' | 'expired';

/**
 * A proposed action Neptune can take
 */
export interface ProposedAction {
  id: string;
  type: ActionType;
  riskLevel: RiskLevel;
  
  // Description
  title: string;
  description: string;
  
  // The actual action details
  action: {
    tool: string;
    parameters: Record<string, unknown>;
  };
  
  // Preview content (for user review)
  preview?: string;
  
  // Affected entities
  affectedEntities: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  
  // Requirements
  requiresConfirmation: boolean;
  confirmationPrompt: string;
  
  // Metadata
  proposedAt: Date;
  expiresAt: Date;
}

/**
 * Action execution result
 */
export interface ActionResult {
  actionId: string;
  status: 'success' | 'failed' | 'partial';
  message: string;
  details?: Record<string, unknown>;
  executedAt: Date;
}

/**
 * Draft content for review
 */
export interface DraftContent {
  id: string;
  type: 'email' | 'message' | 'summary' | 'report';
  subject?: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================================
// ACTION RISK ASSESSMENT
// ============================================================================

/**
 * Assess the risk level of an action
 */
function assessActionRisk(type: ActionType, parameters: Record<string, unknown>): RiskLevel {
  // High risk: Actions that send external communications or make bulk changes
  const highRiskActions: ActionType[] = ['send_reminder', 'batch_update'];
  if (highRiskActions.includes(type)) {
    return 'high';
  }
  
  // Medium risk: Actions that modify data
  const mediumRiskActions: ActionType[] = ['update_lead', 'schedule_followup', 'create_task'];
  if (mediumRiskActions.includes(type)) {
    return 'medium';
  }
  
  // Check for batch operations
  if (parameters.batchSize && Number(parameters.batchSize) > 5) {
    return 'high';
  }
  
  // Low risk: Drafts and summaries (no external action until confirmed)
  return 'low';
}

/**
 * Determine if confirmation is required
 */
function requiresConfirmation(type: ActionType, riskLevel: RiskLevel): boolean {
  // Always require confirmation for high risk
  if (riskLevel === 'high') return true;
  
  // Actions that send things externally always need confirmation
  const externalActions: ActionType[] = ['send_reminder'];
  if (externalActions.includes(type)) return true;
  
  // Drafts don't need confirmation to create, only to send
  const draftActions: ActionType[] = ['draft_email', 'draft_message', 'prepare_report', 'create_summary'];
  if (draftActions.includes(type)) return false;
  
  // Medium risk requires confirmation
  return riskLevel === 'medium';
}

// ============================================================================
// DRAFT GENERATION
// ============================================================================

/**
 * Generate a draft email for a lead
 */
export async function generateLeadEmail(
  prospectId: string,
  purpose: 'follow_up' | 're_engage' | 'proposal' | 'thank_you',
  context?: string
): Promise<DraftContent> {
  // Get prospect data
  const prospect = await db.query.prospects.findFirst({
    where: eq(prospects.id, prospectId),
  });
  
  if (!prospect) {
    throw new Error(`Prospect not found: ${prospectId}`);
  }
  
  const openai = getOpenAI();
  
  const purposePrompts: Record<string, string> = {
    follow_up: `Write a friendly follow-up email to ${prospect.name}${prospect.company ? ` at ${prospect.company}` : ''}. Keep it brief and actionable. End with a clear next step question.`,
    re_engage: `Write a re-engagement email to ${prospect.name}${prospect.company ? ` at ${prospect.company}` : ''}. It's been a while since we talked. Reference that and propose reconnecting. Be warm but not pushy.`,
    proposal: `Write a professional email to ${prospect.name}${prospect.company ? ` at ${prospect.company}` : ''} following up on a proposal or pricing discussion. Be confident but not aggressive.`,
    thank_you: `Write a brief thank you email to ${prospect.name}${prospect.company ? ` at ${prospect.company}` : ''}. Express genuine appreciation and mention next steps.`,
  };
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are writing emails on behalf of a business professional. Write in a warm, professional tone. Keep emails concise (under 150 words). Use "I" language naturally. No corporate jargon.

${context ? `Additional context: ${context}` : ''}

Output JSON:
{
  "subject": "Email subject line",
  "content": "Email body (no greeting, user will add their name)"
}`,
      },
      {
        role: 'user',
        content: purposePrompts[purpose],
      },
    ],
    temperature: 0.7,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  });
  
  const responseText = response.choices[0]?.message?.content || '{}';
  
  try {
    const parsed = JSON.parse(responseText) as { subject: string; content: string };
    
    return {
      id: `draft-${Date.now()}`,
      type: 'email',
      subject: parsed.subject,
      content: parsed.content,
      metadata: {
        prospectId,
        prospectName: prospect.name,
        company: prospect.company,
        purpose,
      },
      createdAt: new Date(),
    };
  } catch {
    throw new Error('Failed to generate email draft');
  }
}

/**
 * Generate a batch of follow-up emails for multiple leads
 */
export async function generateBatchFollowUps(
  prospectIds: string[],
  purpose: 'follow_up' | 're_engage'
): Promise<DraftContent[]> {
  const drafts: DraftContent[] = [];
  
  // Process in smaller batches to avoid rate limits
  for (const prospectId of prospectIds.slice(0, 5)) {
    try {
      const draft = await generateLeadEmail(prospectId, purpose);
      drafts.push(draft);
    } catch (error) {
      logger.error('[AgenticActions] Failed to generate draft for prospect', { prospectId, error });
    }
  }
  
  return drafts;
}

/**
 * Generate a summary report
 */
export async function generateSummaryReport(
  workspaceId: string,
  reportType: 'daily' | 'weekly' | 'pipeline',
  data: Record<string, unknown>
): Promise<DraftContent> {
  const openai = getOpenAI();
  
  const reportPrompts: Record<string, string> = {
    daily: 'Generate a brief daily summary highlighting key activities, wins, and priorities.',
    weekly: 'Generate a weekly summary with key metrics, accomplishments, and focus areas for next week.',
    pipeline: 'Generate a pipeline summary with deal stages, values, and recommended actions.',
  };
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are generating business reports. Use markdown formatting. Be concise and actionable. Use bullet points liberally. Include specific numbers when available.

Data to summarize: ${JSON.stringify(data)}`,
      },
      {
        role: 'user',
        content: reportPrompts[reportType],
      },
    ],
    temperature: 0.5,
    max_tokens: 800,
  });
  
  const content = response.choices[0]?.message?.content || 'Unable to generate report.';
  
  return {
    id: `report-${Date.now()}`,
    type: 'report',
    content,
    metadata: {
      workspaceId,
      reportType,
      dataSnapshot: data,
    },
    createdAt: new Date(),
  };
}

// ============================================================================
// ACTION EXECUTION
// ============================================================================

/**
 * Create a follow-up task for a lead
 */
export async function createFollowUpTask(
  workspaceId: string,
  userId: string,
  prospectId: string,
  daysFromNow: number,
  note?: string
): Promise<ActionResult> {
  try {
    const prospect = await db.query.prospects.findFirst({
      where: eq(prospects.id, prospectId),
    });
    
    if (!prospect) {
      return {
        actionId: `action-${Date.now()}`,
        status: 'failed',
        message: 'Prospect not found',
        executedAt: new Date(),
      };
    }
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysFromNow);
    
    await db.insert(tasks).values({
      workspaceId,
      title: `Follow up with ${prospect.name}${prospect.company ? ` (${prospect.company})` : ''}`,
      description: note || `Scheduled follow-up for prospect: ${prospect.name}`,
      status: 'todo',
      priority: 'medium',
      dueDate,
      assignedTo: userId,
      createdBy: userId,
    });
    
    return {
      actionId: `action-${Date.now()}`,
      status: 'success',
      message: `Created follow-up task for ${prospect.name}, due in ${daysFromNow} days`,
      details: {
        prospectId,
        prospectName: prospect.name,
        dueDate: dueDate.toISOString(),
      },
      executedAt: new Date(),
    };
  } catch (error) {
    logger.error('[AgenticActions] Failed to create follow-up task', { prospectId, error });
    return {
      actionId: `action-${Date.now()}`,
      status: 'failed',
      message: 'Failed to create follow-up task',
      executedAt: new Date(),
    };
  }
}

/**
 * Update lead stage
 */
export async function updateProspectStage(
  prospectId: string,
  newStage: string
): Promise<ActionResult> {
  try {
    const prospect = await db.query.prospects.findFirst({
      where: eq(prospects.id, prospectId),
    });
    
    if (!prospect) {
      return {
        actionId: `action-${Date.now()}`,
        status: 'failed',
        message: 'Prospect not found',
        executedAt: new Date(),
      };
    }
    
    const oldStage = prospect.stage;
    
    await db.update(prospects)
      .set({
        stage: newStage as any,
        updatedAt: new Date(),
      })
      .where(eq(prospects.id, prospectId));
    
    return {
      actionId: `action-${Date.now()}`,
      status: 'success',
      message: `Updated ${prospect.name} from ${oldStage} to ${newStage}`,
      details: {
        prospectId,
        prospectName: prospect.name,
        oldStage,
        newStage,
      },
      executedAt: new Date(),
    };
  } catch (error) {
    logger.error('[AgenticActions] Failed to update prospect stage', { prospectId, error });
    return {
      actionId: `action-${Date.now()}`,
      status: 'failed',
      message: 'Failed to update prospect stage',
      executedAt: new Date(),
    };
  }
}

/**
 * Batch create follow-up tasks for multiple leads
 */
export async function batchCreateFollowUps(
  workspaceId: string,
  userId: string,
  prospectIds: string[],
  daysFromNow: number
): Promise<ActionResult> {
  const results: { success: number; failed: number } = { success: 0, failed: 0 };
  
  for (const prospectId of prospectIds) {
    const result = await createFollowUpTask(workspaceId, userId, prospectId, daysFromNow);
    if (result.status === 'success') {
      results.success++;
    } else {
      results.failed++;
    }
  }
  
  return {
    actionId: `batch-${Date.now()}`,
    status: results.failed === 0 ? 'success' : results.success === 0 ? 'failed' : 'partial',
    message: `Created ${results.success} follow-up tasks${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
    details: results,
    executedAt: new Date(),
  };
}

// ============================================================================
// ACTION PROPOSAL SYSTEM
// ============================================================================

/**
 * Propose an action for user review
 */
export function proposeAction(
  type: ActionType,
  title: string,
  description: string,
  action: { tool: string; parameters: Record<string, unknown> },
  affectedEntities: Array<{ type: string; id: string; name: string }>,
  preview?: string
): ProposedAction {
  const riskLevel = assessActionRisk(type, action.parameters);
  const needsConfirmation = requiresConfirmation(type, riskLevel);
  
  const confirmationPrompts: Record<ActionType, string> = {
    draft_email: 'Would you like me to draft this email?',
    draft_message: 'Would you like me to draft this message?',
    create_task: 'Should I create this task?',
    schedule_followup: 'Want me to schedule this follow-up?',
    update_lead: 'Should I update this lead?',
    prepare_report: 'Want me to prepare this report?',
    send_reminder: 'Ready for me to send this reminder?',
    create_summary: 'Should I create this summary?',
    batch_update: 'This will update multiple items. Proceed?',
  };
  
  // Actions expire after 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  return {
    id: `proposal-${Date.now()}`,
    type,
    riskLevel,
    title,
    description,
    action,
    preview,
    affectedEntities,
    requiresConfirmation: needsConfirmation,
    confirmationPrompt: confirmationPrompts[type],
    proposedAt: new Date(),
    expiresAt,
  };
}

/**
 * Build action proposals based on context
 */
export async function buildContextualProposals(
  workspaceId: string,
  userId: string,
  currentTopic?: string
): Promise<ProposedAction[]> {
  const proposals: ProposedAction[] = [];
  
  try {
    // Check for stale prospects that need follow-up
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const staleProspects = await db.query.prospects.findMany({
      where: and(
        eq(prospects.workspaceId, workspaceId),
        sql`${prospects.updatedAt} < ${twoWeeksAgo}`,
        sql`${prospects.stage} NOT IN ('converted', 'lost')`
      ),
      limit: 5,
    });
    
    if (staleProspects.length > 0) {
      proposals.push(proposeAction(
        'draft_email',
        'Re-engage stale prospects',
        `Draft re-engagement emails for ${staleProspects.length} prospects that haven't been touched in 2+ weeks.`,
        {
          tool: 'generateBatchFollowUps',
          parameters: {
            prospectIds: staleProspects.map(p => p.id),
            purpose: 're_engage',
          },
        },
        staleProspects.map(p => ({ type: 'prospect', id: p.id, name: p.name })),
        `Will draft ${staleProspects.length} personalized re-engagement emails`
      ));
    }
    
    // Check for hot prospects that might need follow-up tasks
    const hotProspects = await db.query.prospects.findMany({
      where: and(
        eq(prospects.workspaceId, workspaceId),
        sql`${prospects.stage} IN ('proposal', 'negotiation')`
      ),
      limit: 5,
    });
    
    if (hotProspects.length > 0) {
      proposals.push(proposeAction(
        'schedule_followup',
        'Schedule hot prospect follow-ups',
        `Create follow-up tasks for ${hotProspects.length} prospects in proposal/negotiation stage.`,
        {
          tool: 'batchCreateFollowUps',
          parameters: {
            workspaceId,
            userId,
            prospectIds: hotProspects.map(p => p.id),
            daysFromNow: 3,
          },
        },
        hotProspects.map(p => ({ type: 'prospect', id: p.id, name: p.name })),
        `Will create follow-up tasks due in 3 days`
      ));
    }
  } catch (error) {
    logger.error('[AgenticActions] Failed to build contextual proposals', { workspaceId, error });
  }
  
  return proposals;
}

// ============================================================================
// PROMPT SECTION BUILDER
// ============================================================================

/**
 * Build a prompt section for available actions
 */
export function buildAgenticActionsPrompt(proposals: ProposedAction[]): string {
  if (proposals.length === 0) {
    return '';
  }
  
  const parts: string[] = [];
  parts.push('## AVAILABLE ACTIONS (Offer these proactively)');
  parts.push('');
  parts.push('Neptune can take these actions. Offer them naturally using "Want me to..." language:');
  parts.push('');
  
  for (const proposal of proposals) {
    const riskIcon = proposal.riskLevel === 'high' ? '⚠️' : 
                     proposal.riskLevel === 'medium' ? '🔸' : '✅';
    
    parts.push(`${riskIcon} **${proposal.title}**`);
    parts.push(`   ${proposal.description}`);
    if (proposal.preview) {
      parts.push(`   Preview: ${proposal.preview}`);
    }
    parts.push(`   → Offer: "${proposal.confirmationPrompt}"`);
    parts.push('');
  }
  
  parts.push('**Action Guidelines:**');
  parts.push('- Low risk (✅): Can offer and do immediately if user agrees');
  parts.push('- Medium risk (🔸): Show preview before executing');
  parts.push('- High risk (⚠️): Require explicit confirmation');
  parts.push('- Never execute without user consent');
  
  return parts.join('\n');
}

// Export types and utilities
export { assessActionRisk, requiresConfirmation };
