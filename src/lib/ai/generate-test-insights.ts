/**
 * Generate Test Proactive Insights
 * 
 * Utility to generate sample insights for testing the proactive insights system
 */

import { db } from '@/lib/db';
import { proactiveInsights } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface TestInsightConfig {
  type: 'opportunity' | 'warning' | 'suggestion' | 'achievement';
  category: 'sales' | 'marketing' | 'operations' | 'finance' | 'content';
  title: string;
  description: string;
  priority: number;
  suggestedActions?: Array<{ action: string; toolName?: string }>;
}

const TEST_INSIGHTS: TestInsightConfig[] = [
  {
    type: 'opportunity',
    category: 'sales',
    title: '3 High-Value Leads Ready for Qualification',
    description: 'You have 3 leads with estimated values over $10,000 that have been contacted but not yet qualified. These represent $45,000 in potential pipeline value.',
    priority: 9,
    suggestedActions: [
      { action: 'Review and qualify high-value leads', toolName: 'get_prospect_list' },
      { action: 'Schedule qualification calls', toolName: 'schedule_meeting' },
    ],
  },
  {
    type: 'warning',
    category: 'sales',
    title: '5 Stalled Leads Need Follow-up',
    description: '5 leads in negotiation stage haven\'t been updated in over a week. Following up now could prevent them from going cold.',
    priority: 8,
    suggestedActions: [
      { action: 'Send follow-up emails', toolName: 'send_email' },
      { action: 'Update lead status', toolName: 'update_prospect' },
    ],
  },
  {
    type: 'suggestion',
    category: 'marketing',
    title: 'Low Campaign Open Rates Detected',
    description: 'Your last 2 campaigns have open rates below 15%. Consider A/B testing subject lines or reviewing your audience segments.',
    priority: 7,
    suggestedActions: [
      { action: 'Analyze campaign performance', toolName: 'get_campaign_analytics' },
      { action: 'Generate new subject line variants', toolName: 'generate_marketing_copy' },
    ],
  },
  {
    type: 'achievement',
    category: 'marketing',
    title: 'Excellent Email Performance This Week!',
    description: 'Your campaigns this week achieved a 32% open rate - well above the 20% industry average. Great work!',
    priority: 4,
  },
  {
    type: 'warning',
    category: 'operations',
    title: '12 Overdue Tasks Require Attention',
    description: 'You have 12 tasks past their due date. Would you like help prioritizing or rescheduling them?',
    priority: 9,
    suggestedActions: [
      { action: 'Review overdue tasks', toolName: 'get_tasks' },
      { action: 'Prioritize by urgency', toolName: 'prioritize_tasks' },
    ],
  },
  {
    type: 'opportunity',
    category: 'content',
    title: 'Top Priority Topic Ready for Content Creation',
    description: 'Your highest-scoring topic "AI-Powered Customer Service" has a priority score of 95. This represents a high-value content opportunity.',
    priority: 7,
    suggestedActions: [
      { action: 'Create content brief', toolName: 'generate_content_brief' },
      { action: 'Draft article', toolName: 'write_article' },
    ],
  },
  {
    type: 'suggestion',
    category: 'content',
    title: 'Add 3 New Content Sources',
    description: 'Your active content sources (2) are below the recommended minimum of 5. More sources improve content diversity and reduce research time.',
    priority: 5,
    suggestedActions: [
      { action: 'Discover trending sources', toolName: 'discover_sources' },
    ],
  },
  {
    type: 'opportunity',
    category: 'finance',
    title: '$8,500 in Outstanding Invoices',
    description: 'You have 3 invoices totaling $8,500 that are past their payment terms. Consider sending payment reminders.',
    priority: 8,
    suggestedActions: [
      { action: 'Send payment reminders', toolName: 'send_payment_reminders' },
      { action: 'Review invoice status', toolName: 'get_invoices' },
    ],
  },
];

/**
 * Generate test insights for a workspace
 */
export async function generateTestInsights(
  workspaceId: string,
  userId?: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Delete existing test insights (those created in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await db
      .delete(proactiveInsights)
      .where(sql`${proactiveInsights.workspaceId} = ${workspaceId} AND ${proactiveInsights.createdAt} >= ${oneHourAgo}`);

    // Insert test insights
    for (const insight of TEST_INSIGHTS) {
      await db.insert(proactiveInsights).values({
        workspaceId,
        userId: userId || null,
        type: insight.type,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
        suggestedActions: insight.suggestedActions || [],
        autoExecutable: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    }

    logger.info('[Test Insights] Generated test insights', { 
      workspaceId, 
      count: TEST_INSIGHTS.length 
    });

    return {
      success: true,
      count: TEST_INSIGHTS.length,
    };
  } catch (error) {
    logger.error('[Test Insights] Failed to generate test insights', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
