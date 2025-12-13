import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals, prospects } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { eq, and, gte, lte, sql, sum, count, desc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

/**
 * GET /api/crm/reports/revenue
 * 
 * Generate comprehensive revenue reports
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30';
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month
    const periodDays = parseInt(period, 10);
    
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    // Get overall revenue metrics
    const [
      currentPeriodRevenue,
      previousPeriodRevenue,
      revenueByStage,
      topDeals,
      monthlyRevenue,
      revenueBySource,
    ] = await Promise.all([
      // Current period revenue (closed won deals)
      db.select({
        totalRevenue: sum(deals.value),
        dealCount: count(),
        avgDealSize: sql<number>`AVG(${deals.value})`,
      })
        .from(deals)
        .where(and(
          eq(deals.workspaceId, workspaceId),
          eq(deals.stage, 'closed_won'),
          gte(deals.updatedAt, periodStart)
        )),
      
      // Previous period revenue for comparison
      db.select({
        totalRevenue: sum(deals.value),
        dealCount: count(),
      })
        .from(deals)
        .where(and(
          eq(deals.workspaceId, workspaceId),
          eq(deals.stage, 'closed_won'),
          gte(deals.updatedAt, previousPeriodStart),
          lte(deals.updatedAt, periodStart)
        )),
      
      // Revenue breakdown by pipeline stage
      db.select({
        stage: deals.stage,
        totalValue: sum(deals.value),
        dealCount: count(),
        avgProbability: sql<number>`AVG(${deals.probability})`,
      })
        .from(deals)
        .where(eq(deals.workspaceId, workspaceId))
        .groupBy(deals.stage),
      
      // Top deals by value
      db.query.deals.findMany({
        where: and(
          eq(deals.workspaceId, workspaceId),
          eq(deals.stage, 'closed_won')
        ),
        orderBy: [desc(deals.value)],
        limit: 10,
      }),
      
      // Monthly revenue trend (last 12 months)
      db.select({
        month: sql<string>`TO_CHAR(${deals.updatedAt}, 'YYYY-MM')`,
        totalRevenue: sum(deals.value),
        dealCount: count(),
      })
        .from(deals)
        .where(and(
          eq(deals.workspaceId, workspaceId),
          eq(deals.stage, 'closed_won'),
          gte(deals.updatedAt, new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000))
        ))
        .groupBy(sql`TO_CHAR(${deals.updatedAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${deals.updatedAt}, 'YYYY-MM')`),
      
      // Revenue by lead source (from linked prospects)
      db.select({
        source: prospects.source,
        totalRevenue: sum(deals.value),
        dealCount: count(),
      })
        .from(deals)
        .leftJoin(prospects, eq(deals.prospectId, prospects.id))
        .where(and(
          eq(deals.workspaceId, workspaceId),
          eq(deals.stage, 'closed_won')
        ))
        .groupBy(prospects.source),
    ]);
    
    // Calculate derived metrics
    const currentRevenue = Number(currentPeriodRevenue[0]?.totalRevenue) || 0;
    const prevRevenue = Number(previousPeriodRevenue[0]?.totalRevenue) || 0;
    const revenueGrowth = prevRevenue > 0 
      ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;
    
    const currentDeals = Number(currentPeriodRevenue[0]?.dealCount) || 0;
    const prevDeals = Number(previousPeriodRevenue[0]?.dealCount) || 0;
    const dealGrowth = prevDeals > 0
      ? Math.round(((currentDeals - prevDeals) / prevDeals) * 100)
      : currentDeals > 0 ? 100 : 0;
    
    // Format pipeline breakdown
    const pipelineBreakdown = (revenueByStage || []).map((row) => ({
      stage: formatStageName(row.stage),
      stageKey: row.stage,
      totalValue: Number(row.totalValue) || 0,
      dealCount: Number(row.dealCount) || 0,
      avgProbability: Math.round(Number(row.avgProbability) || 0),
      weightedValue: Math.round((Number(row.totalValue) || 0) * ((Number(row.avgProbability) || 50) / 100)),
    }));
    
    // Calculate forecast based on weighted pipeline
    const activePipeline = pipelineBreakdown.filter(
      (s) => !['closed_won', 'closed_lost'].includes(s.stageKey)
    );
    const forecastedRevenue = activePipeline.reduce((sum, s) => sum + s.weightedValue, 0);
    const pipelineTotal = activePipeline.reduce((sum, s) => sum + s.totalValue, 0);
    
    // Format top deals
    const formattedTopDeals = (topDeals || []).map((deal) => ({
      id: deal.id,
      title: deal.title,
      value: deal.value,
      closedAt: deal.actualCloseDate || deal.updatedAt,
    }));
    
    // Format monthly trend
    const monthlyTrend = (monthlyRevenue || []).map((row) => ({
      month: row.month,
      revenue: Number(row.totalRevenue) || 0,
      dealCount: Number(row.dealCount) || 0,
    }));
    
    // Format source breakdown
    const sourceBreakdown = (revenueBySource || [])
      .filter((row) => row.source)
      .map((row) => ({
        source: row.source || 'Direct',
        revenue: Number(row.totalRevenue) || 0,
        dealCount: Number(row.dealCount) || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
    
    const report = {
      period: {
        days: periodDays,
        startDate: periodStart.toISOString(),
        endDate: now.toISOString(),
      },
      summary: {
        totalRevenue: currentRevenue,
        revenueGrowth,
        dealCount: currentDeals,
        dealGrowth,
        avgDealSize: Math.round(Number(currentPeriodRevenue[0]?.avgDealSize) || 0),
      },
      forecast: {
        pipelineTotal,
        forecastedRevenue,
        activeDeals: activePipeline.reduce((sum, s) => sum + s.dealCount, 0),
      },
      pipeline: pipelineBreakdown,
      topDeals: formattedTopDeals,
      monthlyTrend,
      sourceBreakdown,
    };
    
    logger.info('Revenue report generated', { workspaceId, periodDays });
    
    return NextResponse.json(report);
  } catch (error) {
    return createErrorResponse(error, 'Generate revenue report error');
  }
}

function formatStageName(stage: string): string {
  const names: Record<string, string> = {
    qualification: 'Qualification',
    discovery: 'Discovery',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    closed_won: 'Closed Won',
    closed_lost: 'Closed Lost',
  };
  return names[stage] || stage;
}

