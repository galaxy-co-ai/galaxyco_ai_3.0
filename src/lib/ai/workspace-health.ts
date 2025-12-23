/**
 * Workspace Health Assessment
 * 
 * Scores workspace completeness and identifies opportunities for improvement.
 * Used to provide proactive recommendations and measure platform adoption.
 */

import { db } from '@/lib/db';
import {
  prospects,
  contacts,
  agents,
  knowledgeItems,
  knowledgeCollections,
  integrations,
  tasks,
  agentExecutions,
} from '@/db/schema';
import { eq, and, gte, count, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WorkspaceHealthScore {
  overall: number; // 0-100
  dimensions: {
    crmHealth: number;        // Contact/lead completeness
    agentUtilization: number; // Created vs active vs running
    workflowCoverage: number; // Manual vs automated tasks
    knowledgeDepth: number;   // Documents, collections
    integrationHealth: number; // Connected services
  };
  gaps: Array<{
    area: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
    estimatedImpact: number; // 0-100
    timeToFix: string;
  }>;
  achievements: Array<{
    milestone: string;
    completedAt: Date;
    description: string;
  }>;
  lastAssessedAt: Date;
}

interface CRMHealthData {
  totalLeads: number;
  leadsWithEmail: number;
  leadsWithCompany: number;
  leadsInActivePipeline: number;
  totalContacts: number;
  contactsWithPhone: number;
  recentActivity: number; // Last 7 days
}

interface AgentHealthData {
  totalAgents: number;
  activeAgents: number;
  totalExecutions: number;
  executionsLast7Days: number;
  avgExecutionsPerAgent: number;
}

interface WorkflowHealthData {
  totalTasks: number;
  completedTasks: number;
  automatedTasks: number;
  overdueTasks: number;
}

interface KnowledgeHealthData {
  totalDocuments: number;
  totalCollections: number;
  documentsWithContent: number;
  recentlyUpdated: number; // Last 30 days
}

interface IntegrationHealthData {
  totalIntegrations: number;
  activeIntegrations: number;
  integrationTypes: string[];
  hasEmailIntegration: boolean;
  hasCalendarIntegration: boolean;
  hasCRMIntegration: boolean;
}

// ============================================================================
// HEALTH DATA GATHERING
// ============================================================================

/**
 * Get CRM health metrics
 */
async function getCRMHealth(workspaceId: string): Promise<CRMHealthData> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get all leads
    const allLeads = await db.query.prospects.findMany({
      where: eq(prospects.workspaceId, workspaceId),
    });
    
    // Calculate metrics
    const totalLeads = allLeads.length;
    const leadsWithEmail = allLeads.filter(l => l.email).length;
    const leadsWithCompany = allLeads.filter(l => l.company).length;
    const leadsInActivePipeline = allLeads.filter(l => 
      !['won', 'lost'].includes(l.stage)
    ).length;
    
    // Get contact count
    const [contactCount] = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    
    const [contactsWithPhone] = await db
      .select({ count: count() })
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, workspaceId),
          sql`${contacts.phone} IS NOT NULL`
        )
      );
    
    // Recent activity (leads/contacts updated in last 7 days)
    const recentLeads = allLeads.filter(l => 
      l.updatedAt && new Date(l.updatedAt) > sevenDaysAgo
    ).length;
    
    return {
      totalLeads,
      leadsWithEmail,
      leadsWithCompany,
      leadsInActivePipeline,
      totalContacts: contactCount?.count || 0,
      contactsWithPhone: contactsWithPhone?.count || 0,
      recentActivity: recentLeads,
    };
  } catch (error) {
    logger.error('Failed to get CRM health', error);
    return {
      totalLeads: 0,
      leadsWithEmail: 0,
      leadsWithCompany: 0,
      leadsInActivePipeline: 0,
      totalContacts: 0,
      contactsWithPhone: 0,
      recentActivity: 0,
    };
  }
}

/**
 * Get agent health metrics
 */
async function getAgentHealth(workspaceId: string): Promise<AgentHealthData> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const allAgents = await db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
    });
    
    const totalAgents = allAgents.length;
    const activeAgents = allAgents.filter(a => a.status === 'active').length;
    const totalExecutions = allAgents.reduce((sum, a) => sum + a.executionCount, 0);
    
    // Get recent executions
    const [recentExecutions] = await db
      .select({ count: count() })
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.workspaceId, workspaceId),
          gte(agentExecutions.createdAt, sevenDaysAgo)
        )
      );
    
    const avgExecutionsPerAgent = totalAgents > 0 
      ? totalExecutions / totalAgents 
      : 0;
    
    return {
      totalAgents,
      activeAgents,
      totalExecutions,
      executionsLast7Days: recentExecutions?.count || 0,
      avgExecutionsPerAgent,
    };
  } catch (error) {
    logger.error('Failed to get agent health', error);
    return {
      totalAgents: 0,
      activeAgents: 0,
      totalExecutions: 0,
      executionsLast7Days: 0,
      avgExecutionsPerAgent: 0,
    };
  }
}

/**
 * Get workflow/task health metrics
 */
async function getWorkflowHealth(workspaceId: string): Promise<WorkflowHealthData> {
  try {
    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.workspaceId, workspaceId),
    });
    
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'done').length;
    const automatedTasks = allTasks.filter(t => 
      t.createdBy && t.createdBy.includes('agent')
    ).length;
    
    const now = new Date();
    const overdueTasks = allTasks.filter(t => 
      t.status === 'todo' && 
      t.dueDate && 
      new Date(t.dueDate) < now
    ).length;
    
    return {
      totalTasks,
      completedTasks,
      automatedTasks,
      overdueTasks,
    };
  } catch (error) {
    logger.error('Failed to get workflow health', error);
    return {
      totalTasks: 0,
      completedTasks: 0,
      automatedTasks: 0,
      overdueTasks: 0,
    };
  }
}

/**
 * Get knowledge base health metrics
 */
async function getKnowledgeHealth(workspaceId: string): Promise<KnowledgeHealthData> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [documentCount] = await db
      .select({ count: count() })
      .from(knowledgeItems)
      .where(eq(knowledgeItems.workspaceId, workspaceId));
    
    const [collectionCount] = await db
      .select({ count: count() })
      .from(knowledgeCollections)
      .where(eq(knowledgeCollections.workspaceId, workspaceId));
    
    const [documentsWithContent] = await db
      .select({ count: count() })
      .from(knowledgeItems)
      .where(
        and(
          eq(knowledgeItems.workspaceId, workspaceId),
          sql`${knowledgeItems.content} IS NOT NULL AND LENGTH(${knowledgeItems.content}) > 100`
        )
      );
    
    const [recentlyUpdated] = await db
      .select({ count: count() })
      .from(knowledgeItems)
      .where(
        and(
          eq(knowledgeItems.workspaceId, workspaceId),
          gte(knowledgeItems.updatedAt, thirtyDaysAgo)
        )
      );
    
    return {
      totalDocuments: documentCount?.count || 0,
      totalCollections: collectionCount?.count || 0,
      documentsWithContent: documentsWithContent?.count || 0,
      recentlyUpdated: recentlyUpdated?.count || 0,
    };
  } catch (error) {
    logger.error('Failed to get knowledge health', error);
    return {
      totalDocuments: 0,
      totalCollections: 0,
      documentsWithContent: 0,
      recentlyUpdated: 0,
    };
  }
}

/**
 * Get integration health metrics
 */
async function getIntegrationHealth(workspaceId: string): Promise<IntegrationHealthData> {
  try {
    const allIntegrations = await db.query.integrations.findMany({
      where: eq(integrations.workspaceId, workspaceId),
    });
    
    const totalIntegrations = allIntegrations.length;
    const activeIntegrations = allIntegrations.filter(i => i.status === 'active').length;
    const integrationTypes = [...new Set(allIntegrations.map(i => i.provider))];
    
    const hasEmailIntegration = integrationTypes.some(t => 
      ['gmail', 'outlook', 'email'].includes(t)
    );
    const hasCalendarIntegration = integrationTypes.some(t => 
      ['google-calendar', 'outlook-calendar', 'calendar'].includes(t)
    );
    const hasCRMIntegration = integrationTypes.some(t => 
      ['salesforce', 'hubspot', 'pipedrive', 'crm'].includes(t)
    );
    
    return {
      totalIntegrations,
      activeIntegrations,
      integrationTypes,
      hasEmailIntegration,
      hasCalendarIntegration,
      hasCRMIntegration,
    };
  } catch (error) {
    logger.error('Failed to get integration health', error);
    return {
      totalIntegrations: 0,
      activeIntegrations: 0,
      integrationTypes: [],
      hasEmailIntegration: false,
      hasCalendarIntegration: false,
      hasCRMIntegration: false,
    };
  }
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Score CRM health (0-100)
 */
function scoreCRM(data: CRMHealthData): number {
  let score = 0;
  
  // Has any leads or contacts (20 points)
  if (data.totalLeads > 0 || data.totalContacts > 0) {
    score += 20;
  }
  
  // Data completeness (30 points)
  if (data.totalLeads > 0) {
    const emailCompleteness = data.leadsWithEmail / data.totalLeads;
    const companyCompleteness = data.leadsWithCompany / data.totalLeads;
    score += Math.round((emailCompleteness + companyCompleteness) / 2 * 30);
  }
  
  // Active pipeline (25 points)
  if (data.leadsInActivePipeline > 0) {
    score += 25;
  }
  
  // Recent activity (25 points)
  if (data.recentActivity > 0) {
    const activityRate = Math.min(data.recentActivity / 10, 1); // Cap at 10 updates
    score += Math.round(activityRate * 25);
  }
  
  return Math.min(score, 100);
}

/**
 * Score agent utilization (0-100)
 */
function scoreAgents(data: AgentHealthData): number {
  let score = 0;
  
  // Has agents created (30 points)
  if (data.totalAgents > 0) {
    score += 30;
  }
  
  // Agents are active (30 points)
  if (data.totalAgents > 0) {
    const activeRate = data.activeAgents / data.totalAgents;
    score += Math.round(activeRate * 30);
  }
  
  // Agents are being used (40 points)
  if (data.executionsLast7Days > 0) {
    const executionScore = Math.min(data.executionsLast7Days / 20, 1); // Cap at 20 executions
    score += Math.round(executionScore * 40);
  }
  
  return Math.min(score, 100);
}

/**
 * Score workflow coverage (0-100)
 */
function scoreWorkflows(data: WorkflowHealthData): number {
  let score = 0;
  
  // Has tasks (25 points)
  if (data.totalTasks > 0) {
    score += 25;
  }
  
  // Task completion rate (35 points)
  if (data.totalTasks > 0) {
    const completionRate = data.completedTasks / data.totalTasks;
    score += Math.round(completionRate * 35);
  }
  
  // Automation rate (30 points)
  if (data.totalTasks > 0) {
    const automationRate = data.automatedTasks / data.totalTasks;
    score += Math.round(automationRate * 30);
  }
  
  // Penalty for overdue tasks (10 points)
  if (data.overdueTasks === 0) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * Score knowledge depth (0-100)
 */
function scoreKnowledge(data: KnowledgeHealthData): number {
  let score = 0;
  
  // Has documents (30 points)
  if (data.totalDocuments > 0) {
    score += 30;
  }
  
  // Has collections (20 points)
  if (data.totalCollections > 0) {
    score += 20;
  }
  
  // Content quality (30 points)
  if (data.totalDocuments > 0) {
    const qualityRate = data.documentsWithContent / data.totalDocuments;
    score += Math.round(qualityRate * 30);
  }
  
  // Recent updates (20 points)
  if (data.recentlyUpdated > 0) {
    const updateScore = Math.min(data.recentlyUpdated / 5, 1); // Cap at 5 updates
    score += Math.round(updateScore * 20);
  }
  
  return Math.min(score, 100);
}

/**
 * Score integration health (0-100)
 */
function scoreIntegrations(data: IntegrationHealthData): number {
  let score = 0;
  
  // Has any integrations (30 points)
  if (data.totalIntegrations > 0) {
    score += 30;
  }
  
  // Integrations are active (20 points)
  if (data.totalIntegrations > 0) {
    const activeRate = data.activeIntegrations / data.totalIntegrations;
    score += Math.round(activeRate * 20);
  }
  
  // Key integrations (50 points total)
  if (data.hasEmailIntegration) {
    score += 20;
  }
  if (data.hasCalendarIntegration) {
    score += 15;
  }
  if (data.hasCRMIntegration) {
    score += 15;
  }
  
  return Math.min(score, 100);
}

// ============================================================================
// GAP IDENTIFICATION
// ============================================================================

/**
 * Identify gaps and generate recommendations
 */
function identifyGaps(
  scores: WorkspaceHealthScore['dimensions'],
  data: {
    crm: CRMHealthData;
    agents: AgentHealthData;
    workflows: WorkflowHealthData;
    knowledge: KnowledgeHealthData;
    integrations: IntegrationHealthData;
  }
): WorkspaceHealthScore['gaps'] {
  const gaps: WorkspaceHealthScore['gaps'] = [];
  
  // CRM gaps
  if (scores.crmHealth < 30) {
    gaps.push({
      area: 'CRM',
      severity: 'critical',
      description: 'No leads or contacts in your CRM',
      recommendation: 'Start by adding your first lead or import contacts from a CSV',
      estimatedImpact: 90,
      timeToFix: '5 minutes',
    });
  } else if (scores.crmHealth < 60) {
    if (data.crm.leadsWithEmail / Math.max(data.crm.totalLeads, 1) < 0.5) {
      gaps.push({
        area: 'CRM',
        severity: 'high',
        description: 'Many leads are missing email addresses',
        recommendation: 'Use the data enrichment agent to fill in missing contact info',
        estimatedImpact: 70,
        timeToFix: '2 minutes',
      });
    }
    if (data.crm.recentActivity === 0) {
      gaps.push({
        area: 'CRM',
        severity: 'medium',
        description: 'No recent CRM activity detected',
        recommendation: 'Update lead stages or add notes to keep pipeline fresh',
        estimatedImpact: 60,
        timeToFix: '10 minutes',
      });
    }
  }
  
  // Agent gaps
  if (scores.agentUtilization === 0) {
    gaps.push({
      area: 'Agents',
      severity: 'critical',
      description: 'No AI agents created yet',
      recommendation: 'Create your first agent - try "create an agent that follows up with leads"',
      estimatedImpact: 95,
      timeToFix: '1 minute',
    });
  } else if (scores.agentUtilization < 50) {
    if (data.agents.activeAgents < data.agents.totalAgents) {
      gaps.push({
        area: 'Agents',
        severity: 'medium',
        description: `${data.agents.totalAgents - data.agents.activeAgents} agents are inactive`,
        recommendation: 'Activate dormant agents or delete ones you don\'t need',
        estimatedImpact: 50,
        timeToFix: '3 minutes',
      });
    }
    if (data.agents.executionsLast7Days === 0) {
      gaps.push({
        area: 'Agents',
        severity: 'high',
        description: 'Agents aren\'t running - no executions in the last week',
        recommendation: 'Set up triggers or run agents manually to see them in action',
        estimatedImpact: 80,
        timeToFix: '5 minutes',
      });
    }
  }
  
  // Workflow gaps
  if (scores.workflowCoverage < 30) {
    gaps.push({
      area: 'Workflows',
      severity: 'medium',
      description: 'Limited task and workflow tracking',
      recommendation: 'Create tasks for your daily work to start automating',
      estimatedImpact: 60,
      timeToFix: '5 minutes',
    });
  }
  
  // Knowledge gaps
  if (scores.knowledgeDepth < 30) {
    gaps.push({
      area: 'Knowledge',
      severity: 'low',
      description: 'No knowledge base documents',
      recommendation: 'Upload company docs, playbooks, or SOPs to train your agents',
      estimatedImpact: 50,
      timeToFix: '10 minutes',
    });
  }
  
  // Integration gaps
  if (scores.integrationHealth < 30) {
    gaps.push({
      area: 'Integrations',
      severity: 'high',
      description: 'No integrations connected',
      recommendation: 'Connect your email or calendar to unlock automation',
      estimatedImpact: 85,
      timeToFix: '3 minutes',
    });
  }
  
  // Sort by severity and impact
  gaps.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.estimatedImpact - a.estimatedImpact;
  });
  
  return gaps;
}

/**
 * Identify achievements/milestones
 */
function identifyAchievements(
  scores: WorkspaceHealthScore['dimensions'],
  data: {
    crm: CRMHealthData;
    agents: AgentHealthData;
  }
): WorkspaceHealthScore['achievements'] {
  const achievements: WorkspaceHealthScore['achievements'] = [];
  
  // First lead
  if (data.crm.totalLeads >= 1) {
    achievements.push({
      milestone: 'First Lead',
      completedAt: new Date(),
      description: 'Added your first lead to the CRM',
    });
  }
  
  // First agent
  if (data.agents.totalAgents >= 1) {
    achievements.push({
      milestone: 'First Agent',
      completedAt: new Date(),
      description: 'Created your first AI agent',
    });
  }
  
  // Agent active
  if (data.agents.executionsLast7Days >= 1) {
    achievements.push({
      milestone: 'Agent Activated',
      completedAt: new Date(),
      description: 'Your agents are running and automating work',
    });
  }
  
  // Strong CRM
  if (scores.crmHealth >= 80) {
    achievements.push({
      milestone: 'CRM Master',
      completedAt: new Date(),
      description: 'Your CRM is well-organized and complete',
    });
  }
  
  // Full automation
  if (scores.agentUtilization >= 80) {
    achievements.push({
      milestone: 'Automation Pro',
      completedAt: new Date(),
      description: 'Your workspace is highly automated',
    });
  }
  
  return achievements;
}

// ============================================================================
// MAIN ASSESSMENT FUNCTION
// ============================================================================

/**
 * Assess overall workspace health
 */
export async function assessWorkspaceHealth(
  workspaceId: string
): Promise<WorkspaceHealthScore> {
  try {
    logger.info('Assessing workspace health', { workspaceId });
    
    // Gather all health data in parallel
    const [crm, agents, workflows, knowledge, integrations] = await Promise.all([
      getCRMHealth(workspaceId),
      getAgentHealth(workspaceId),
      getWorkflowHealth(workspaceId),
      getKnowledgeHealth(workspaceId),
      getIntegrationHealth(workspaceId),
    ]);
    
    // Score each dimension
    const scores: WorkspaceHealthScore['dimensions'] = {
      crmHealth: scoreCRM(crm),
      agentUtilization: scoreAgents(agents),
      workflowCoverage: scoreWorkflows(workflows),
      knowledgeDepth: scoreKnowledge(knowledge),
      integrationHealth: scoreIntegrations(integrations),
    };
    
    // Calculate overall score (weighted average)
    const overall = Math.round(
      scores.crmHealth * 0.25 +
      scores.agentUtilization * 0.30 +
      scores.workflowCoverage * 0.15 +
      scores.knowledgeDepth * 0.15 +
      scores.integrationHealth * 0.15
    );
    
    // Identify gaps
    const gaps = identifyGaps(scores, { crm, agents, workflows, knowledge, integrations });
    
    // Identify achievements
    const achievements = identifyAchievements(scores, { crm, agents });
    
    const result: WorkspaceHealthScore = {
      overall,
      dimensions: scores,
      gaps,
      achievements,
      lastAssessedAt: new Date(),
    };
    
    logger.info('Workspace health assessed', {
      workspaceId,
      overall,
      gapCount: gaps.length,
      achievementCount: achievements.length,
    });
    
    return result;
  } catch (error) {
    logger.error('Failed to assess workspace health', error);
    
    // Return default/empty health score on error
    return {
      overall: 0,
      dimensions: {
        crmHealth: 0,
        agentUtilization: 0,
        workflowCoverage: 0,
        knowledgeDepth: 0,
        integrationHealth: 0,
      },
      gaps: [],
      achievements: [],
      lastAssessedAt: new Date(),
    };
  }
}

/**
 * Get a quick health summary string
 */
export function getHealthSummary(health: WorkspaceHealthScore): string {
  const emoji = health.overall >= 80 ? '🚀' : health.overall >= 60 ? '✅' : health.overall >= 40 ? '⚠️' : '🔴';
  
  let summary = `${emoji} Workspace Health: ${health.overall}%\n\n`;
  
  // Add top 3 gaps
  const topGaps = health.gaps.slice(0, 3);
  if (topGaps.length > 0) {
    summary += `**Priority Actions:**\n`;
    topGaps.forEach((gap, i) => {
      summary += `${i + 1}. ${gap.description} (${gap.timeToFix})\n`;
    });
  }
  
  return summary;
}

