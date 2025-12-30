/**
 * Analytics Tool Implementations
 */
import type { ToolImplementations } from '../types';
import { db } from '@/lib/db';
import { prospects } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const analyticsToolImplementations: ToolImplementations = {
  // Analytics: Get Pipeline Summary
  async get_pipeline_summary(args, context) {
    try {
      const allProspects = await db.query.prospects.findMany({
        where: eq(prospects.workspaceId, context.workspaceId),
      });

      const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
      const pipelineSummary = stages.map((stage) => {
        const stageProspects = allProspects.filter((p) => p.stage === stage);
        const totalValue = stageProspects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
        return {
          stage,
          count: stageProspects.length,
          totalValue: totalValue / 100, // Convert from cents
        };
      });

      const totalLeads = allProspects.length;
      const wonDeals = allProspects.filter((p) => p.stage === 'won').length;
      const conversionRate = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : 0;
      const totalPipelineValue = allProspects
        .filter((p) => !['won', 'lost'].includes(p.stage))
        .reduce((sum, p) => sum + (p.estimatedValue || 0), 0) / 100;

      return {
        success: true,
        message: 'Pipeline summary retrieved',
        data: {
          totalLeads,
          conversionRate: `${conversionRate}%`,
          totalPipelineValue,
          byStage: pipelineSummary,
        },
      };
    } catch (error) {
      logger.error('AI get_pipeline_summary failed', error);
      return {
        success: false,
        message: 'Failed to get pipeline summary',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Analytics: Get Hot Leads
  async get_hot_leads(args, context) {
    try {
      const limit = (args.limit as number) || 5;

      // Get leads that are in active stages with highest scores/values
      const hotLeads = await db.query.prospects.findMany({
        where: and(
          eq(prospects.workspaceId, context.workspaceId),
          or(
            eq(prospects.stage, 'qualified'),
            eq(prospects.stage, 'proposal'),
            eq(prospects.stage, 'negotiation')
          )
        ),
        orderBy: [desc(prospects.score), desc(prospects.estimatedValue)],
        limit,
      });

      return {
        success: true,
        message: `Found ${hotLeads.length} hot lead(s) ready to close`,
        data: {
          leads: hotLeads.map((p) => ({
            id: p.id,
            name: p.name,
            company: p.company,
            stage: p.stage,
            score: p.score,
            estimatedValue: p.estimatedValue ? p.estimatedValue / 100 : null,
            nextFollowUpAt: p.nextFollowUpAt,
          })),
        },
      };
    } catch (error) {
      logger.error('AI get_hot_leads failed', error);
      return {
        success: false,
        message: 'Failed to get hot leads',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
