/**
 * Analytics Tool Implementations
 */
import type { ToolImplementations, ToolResult } from '../types';
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

  // Analytics: Get Conversion Metrics
  async get_conversion_metrics(args, context): Promise<ToolResult> {
    try {
      const allProspects = await db.query.prospects.findMany({
        where: eq(prospects.workspaceId, context.workspaceId),
      });

      const total = allProspects.length;
      const won = allProspects.filter(p => p.stage === 'won').length;
      const lost = allProspects.filter(p => p.stage === 'lost').length;
      const qualified = allProspects.filter(p => ['qualified', 'proposal', 'negotiation', 'won'].includes(p.stage)).length;

      return {
        success: true,
        message: 'Conversion metrics calculated',
        data: {
          totalLeads: total,
          qualified,
          won,
          lost,
          winRate: total > 0 ? ((won / total) * 100).toFixed(1) + '%' : '0%',
          qualificationRate: total > 0 ? ((qualified / total) * 100).toFixed(1) + '%' : '0%',
          lossRate: total > 0 ? ((lost / total) * 100).toFixed(1) + '%' : '0%',
        },
      };
    } catch (error) {
      logger.error('AI get_conversion_metrics failed', error);
      return {
        success: false,
        message: 'Failed to get conversion metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Analytics: Forecast Revenue
  async forecast_revenue(args, context): Promise<ToolResult> {
    try {
      const months = (args.months as number) || 3;

      // Get active pipeline deals
      const activeDeals = await db.query.prospects.findMany({
        where: and(
          eq(prospects.workspaceId, context.workspaceId),
          or(
            eq(prospects.stage, 'qualified'),
            eq(prospects.stage, 'proposal'),
            eq(prospects.stage, 'negotiation')
          )
        ),
      });

      // Simple probability-weighted forecast
      const stageProbabilities: Record<string, number> = {
        qualified: 0.2,
        proposal: 0.5,
        negotiation: 0.75,
      };

      let weightedForecast = 0;
      const dealForecasts = activeDeals.map(d => {
        const probability = stageProbabilities[d.stage] || 0;
        const value = (d.estimatedValue || 0) / 100;
        const weighted = value * probability;
        weightedForecast += weighted;
        return {
          name: d.name,
          value,
          stage: d.stage,
          probability: (probability * 100) + '%',
          weightedValue: weighted,
        };
      });

      return {
        success: true,
        message: `Revenue forecast for next ${months} months`,
        data: {
          totalPipelineValue: activeDeals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0) / 100,
          weightedForecast,
          dealCount: activeDeals.length,
          topDeals: dealForecasts.slice(0, 5),
        },
      };
    } catch (error) {
      logger.error('AI forecast_revenue failed', error);
      return {
        success: false,
        message: 'Failed to forecast revenue',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Analytics: Get Team Performance
  async get_team_performance(args, context): Promise<ToolResult> {
    try {
      // Get all prospects to analyze team performance
      const allProspects = await db.query.prospects.findMany({
        where: eq(prospects.workspaceId, context.workspaceId),
      });

      const totalLeads = allProspects.length;
      const wonDeals = allProspects.filter(p => p.stage === 'won');
      const totalRevenue = wonDeals.reduce((sum, p) => sum + (p.estimatedValue || 0), 0) / 100;

      return {
        success: true,
        message: 'Team performance metrics',
        data: {
          totalLeads,
          dealsWon: wonDeals.length,
          totalRevenue,
          avgDealSize: wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0,
          activeDeals: allProspects.filter(p => !['won', 'lost'].includes(p.stage)).length,
        },
      };
    } catch (error) {
      logger.error('AI get_team_performance failed', error);
      return {
        success: false,
        message: 'Failed to get team performance',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
