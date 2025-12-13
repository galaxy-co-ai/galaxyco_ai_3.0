import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects, deals, contacts } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { eq, and, gte, lte, count, sum, sql, desc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

/**
 * GET /api/crm/analytics
 * 
 * Get comprehensive sales analytics with real-time metrics from the database
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30'; // days
    const periodDays = parseInt(period, 10);
    
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    // Run all queries in parallel for performance
    const [
      leadStats,
      dealStats,
      contactStats,
      revenueStats,
      pipelineByStage,
      leadsBySource,
      recentDeals,
      previousLeadCount,
      previousDealCount,
      previousRevenue,
    ] = await Promise.all([
      // Current period lead stats
      db.select({
        total: count(),
        newLeads: count(sql`CASE WHEN ${prospects.createdAt} >= ${periodStart} THEN 1 END`),
        qualifiedLeads: count(sql`CASE WHEN ${prospects.stage} = 'qualified' THEN 1 END`),
        hotLeads: count(sql`CASE WHEN 'hot' = ANY(${prospects.tags}) THEN 1 END`),
      })
        .from(prospects)
        .where(eq(prospects.workspaceId, workspaceId)),
      
      // Deal stats
      db.select({
        total: count(),
        activeDeals: count(sql`CASE WHEN ${deals.stage} NOT IN ('closed_won', 'closed_lost') THEN 1 END`),
        wonDeals: count(sql`CASE WHEN ${deals.stage} = 'closed_won' THEN 1 END`),
        lostDeals: count(sql`CASE WHEN ${deals.stage} = 'closed_lost' THEN 1 END`),
        totalValue: sum(deals.value),
        wonValue: sum(sql`CASE WHEN ${deals.stage} = 'closed_won' THEN ${deals.value} ELSE 0 END`),
        avgDealSize: sql<number>`AVG(${deals.value})`,
        avgProbability: sql<number>`AVG(${deals.probability})`,
      })
        .from(deals)
        .where(eq(deals.workspaceId, workspaceId)),
      
      // Contact stats
      db.select({
        total: count(),
        recentlyContacted: count(sql`CASE WHEN ${contacts.lastContactedAt} >= ${periodStart} THEN 1 END`),
      })
        .from(contacts)
        .where(eq(contacts.workspaceId, workspaceId)),
      
      // Revenue from won deals in current period
      db.select({
        periodRevenue: sum(sql`CASE WHEN ${deals.updatedAt} >= ${periodStart} AND ${deals.stage} = 'closed_won' THEN ${deals.value} ELSE 0 END`),
      })
        .from(deals)
        .where(eq(deals.workspaceId, workspaceId)),
      
      // Pipeline by stage
      db.select({
        stage: deals.stage,
        dealCount: count(),
        totalValue: sum(deals.value),
      })
        .from(deals)
        .where(eq(deals.workspaceId, workspaceId))
        .groupBy(deals.stage),
      
      // Leads by source
      db.select({
        source: prospects.source,
        leadCount: count(),
      })
        .from(prospects)
        .where(eq(prospects.workspaceId, workspaceId))
        .groupBy(prospects.source),
      
      // Recent deals
      db.query.deals.findMany({
        where: eq(deals.workspaceId, workspaceId),
        orderBy: [desc(deals.updatedAt)],
        limit: 5,
      }),
      
      // Previous period lead count for trend
      db.select({
        count: count(),
      })
        .from(prospects)
        .where(and(
          eq(prospects.workspaceId, workspaceId),
          gte(prospects.createdAt, previousPeriodStart),
          lte(prospects.createdAt, periodStart)
        )),
      
      // Previous period deals for trend
      db.select({
        count: count(),
      })
        .from(deals)
        .where(and(
          eq(deals.workspaceId, workspaceId),
          gte(deals.createdAt, previousPeriodStart),
          lte(deals.createdAt, periodStart)
        )),
      
      // Previous period revenue for trend
      db.select({
        revenue: sum(deals.value),
      })
        .from(deals)
        .where(and(
          eq(deals.workspaceId, workspaceId),
          eq(deals.stage, 'closed_won'),
          gte(deals.updatedAt, previousPeriodStart),
          lte(deals.updatedAt, periodStart)
        )),
    ]);
    
    // Calculate derived metrics
    const currentLeadStats = leadStats[0] || { total: 0, newLeads: 0, qualifiedLeads: 0, hotLeads: 0 };
    const currentDealStats = dealStats[0] || { total: 0, activeDeals: 0, wonDeals: 0, lostDeals: 0, totalValue: 0, wonValue: 0, avgDealSize: 0, avgProbability: 0 };
    const currentContactStats = contactStats[0] || { total: 0, recentlyContacted: 0 };
    const currentRevenueStats = revenueStats[0] || { periodRevenue: 0 };
    
    const wonDeals = Number(currentDealStats.wonDeals) || 0;
    const lostDeals = Number(currentDealStats.lostDeals) || 0;
    const winRate = wonDeals + lostDeals > 0 
      ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) 
      : 0;
    
    // Calculate trends (percentage change from previous period)
    const prevLeadCount = previousLeadCount[0]?.count || 0;
    const currentNewLeads = Number(currentLeadStats.newLeads) || 0;
    const leadTrend = prevLeadCount > 0 
      ? Math.round(((currentNewLeads - Number(prevLeadCount)) / Number(prevLeadCount)) * 100)
      : currentNewLeads > 0 ? 100 : 0;
    
    const prevDealCount = previousDealCount[0]?.count || 0;
    const currentDeals = Number(currentDealStats.total) || 0;
    const dealTrend = Number(prevDealCount) > 0
      ? Math.round(((currentDeals - Number(prevDealCount)) / Number(prevDealCount)) * 100)
      : currentDeals > 0 ? 100 : 0;
    
    const prevRevenue = Number(previousRevenue[0]?.revenue) || 0;
    const currentRevenue = Number(currentRevenueStats.periodRevenue) || 0;
    const revenueTrend = prevRevenue > 0
      ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;
    
    // Format pipeline by stage
    const pipeline = (pipelineByStage || []).map((row) => ({
      stage: row.stage,
      dealCount: Number(row.dealCount) || 0,
      totalValue: Number(row.totalValue) || 0,
    }));
    
    // Format leads by source
    const sourceBreakdown = (leadsBySource || [])
      .filter((row) => row.source)
      .map((row) => ({
        source: row.source || 'Unknown',
        count: Number(row.leadCount) || 0,
      }))
      .sort((a, b) => b.count - a.count);
    
    const analytics = {
      period: {
        days: periodDays,
        startDate: periodStart.toISOString(),
        endDate: now.toISOString(),
      },
      summary: {
        totalLeads: Number(currentLeadStats.total) || 0,
        newLeadsThisPeriod: currentNewLeads,
        leadTrend,
        qualifiedLeads: Number(currentLeadStats.qualifiedLeads) || 0,
        hotLeads: Number(currentLeadStats.hotLeads) || 0,
        totalContacts: Number(currentContactStats.total) || 0,
        recentlyContacted: Number(currentContactStats.recentlyContacted) || 0,
      },
      deals: {
        total: Number(currentDealStats.total) || 0,
        active: Number(currentDealStats.activeDeals) || 0,
        won: wonDeals,
        lost: lostDeals,
        dealTrend,
        winRate,
        avgDealSize: Math.round(Number(currentDealStats.avgDealSize) || 0),
        avgProbability: Math.round(Number(currentDealStats.avgProbability) || 0),
      },
      revenue: {
        totalPipeline: Number(currentDealStats.totalValue) || 0,
        wonRevenue: Number(currentDealStats.wonValue) || 0,
        periodRevenue: currentRevenue,
        revenueTrend,
        weightedPipeline: Math.round(
          (Number(currentDealStats.totalValue) || 0) * 
          ((Number(currentDealStats.avgProbability) || 50) / 100)
        ),
      },
      pipeline,
      sourceBreakdown,
      recentDeals: (recentDeals || []).map((deal) => ({
        id: deal.id,
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        updatedAt: deal.updatedAt,
      })),
    };
    
    logger.info('Sales analytics retrieved', { workspaceId, periodDays });
    
    return NextResponse.json(analytics);
  } catch (error) {
    return createErrorResponse(error, 'Get sales analytics error');
  }
}

