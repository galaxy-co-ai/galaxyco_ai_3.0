/**
 * Deal Forecasting Service
 * 
 * Analyzes deals by pipeline stage to generate revenue forecasts.
 * Uses weighted probability based on stage win rates.
 */

import { db } from '@/lib/db';
import { deals, pipelineStages, dealPipelines } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ForecastPeriod {
  period: string; // e.g., "2025-01", "Q1 2025"
  startDate: Date;
  endDate: Date;
  deals: number;
  totalValue: number;
  weightedValue: number;
  wonValue: number;
  lostValue: number;
  openValue: number;
}

export interface PipelineForecast {
  pipeline: {
    id: string;
    name: string;
  };
  stages: Array<{
    id: string;
    name: string;
    probability: number;
    deals: number;
    value: number;
    weightedValue: number;
  }>;
  totals: {
    deals: number;
    value: number;
    weightedValue: number;
  };
}

export interface ForecastSummary {
  // Overall metrics
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
  averageDealSize: number;
  
  // By status
  openDeals: number;
  openValue: number;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  lostValue: number;
  
  // Win rate
  winRate: number;
  
  // By period
  periods: ForecastPeriod[];
  
  // By pipeline
  pipelines: PipelineForecast[];
  
  // Date range
  dateRange: {
    start: string;
    end: string;
  };
}

// Helper to determine deal status from stage
function getDealStatus(deal: { stage: string; stage_rel?: { stageType: string } | null }): 'open' | 'won' | 'lost' {
  // Check stage relation first (custom pipelines)
  if (deal.stage_rel?.stageType) {
    return deal.stage_rel.stageType as 'open' | 'won' | 'lost';
  }
  // Fall back to legacy stage enum
  if (deal.stage === 'closed_won') return 'won';
  if (deal.stage === 'closed_lost') return 'lost';
  return 'open';
}

// ============================================================================
// FORECAST FUNCTIONS
// ============================================================================

/**
 * Generate deal forecast for a workspace
 */
export async function generateForecast(
  workspaceId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    pipelineId?: string;
    periodType?: 'monthly' | 'quarterly';
  } = {}
): Promise<ForecastSummary> {
  const {
    startDate = new Date(new Date().getFullYear(), 0, 1), // Start of current year
    endDate = new Date(new Date().getFullYear(), 11, 31), // End of current year
    pipelineId,
    periodType = 'monthly',
  } = options;

  // Base conditions
  const conditions = [
    eq(deals.workspaceId, workspaceId),
    gte(deals.expectedCloseDate, startDate),
    lte(deals.expectedCloseDate, endDate),
  ];

  if (pipelineId) {
    conditions.push(eq(deals.pipelineId, pipelineId));
  }

  // Get all deals in range
  const rawDeals = await db.query.deals.findMany({
    where: and(...conditions),
    with: {
      stage: true,
      pipeline: true,
    },
  });
  
  // Map deals with computed status
  const allDeals = rawDeals.map(d => ({
    ...d,
    status: getDealStatus({ stage: d.stage, stage_rel: d.stage }),
    stageProbability: d.stage?.probability ?? d.probability ?? 50,
  }));

  // Get pipelines with stages
  const pipelinesWithStages = await db.query.dealPipelines.findMany({
    where: pipelineId 
      ? eq(dealPipelines.id, pipelineId)
      : eq(dealPipelines.workspaceId, workspaceId),
    with: {
      stages: {
        orderBy: (stages, { asc }) => [asc(stages.displayOrder)],
      },
    },
  });

  // Calculate overall metrics
  const totalDeals = allDeals.length;
  const totalValue = allDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  
  const openDeals = allDeals.filter(d => d.status === 'open');
  const wonDeals = allDeals.filter(d => d.status === 'won');
  const lostDeals = allDeals.filter(d => d.status === 'lost');
  
  const openValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const lostValue = lostDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  
  // Calculate weighted value based on stage probability
  const weightedValue = allDeals.reduce((sum, d) => {
    if (d.status === 'won') return sum + (d.value || 0);
    if (d.status === 'lost') return sum;
    return sum + ((d.value || 0) * d.stageProbability / 100);
  }, 0);
  
  // Calculate win rate
  const closedDeals = wonDeals.length + lostDeals.length;
  const winRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;
  
  // Generate periods
  const periods = generatePeriods(allDeals, startDate, endDate, periodType);
  
  // Generate pipeline forecasts
  const pipelines: PipelineForecast[] = pipelinesWithStages.map(pipeline => {
    const pipelineDeals = allDeals.filter(d => d.pipelineId === pipeline.id);
    
    const stages = pipeline.stages.map(stage => {
      const stageDeals = pipelineDeals.filter(d => d.stageId === stage.id && d.status === 'open');
      const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const stageProbability = stage.probability || 50;
      
      return {
        id: stage.id,
        name: stage.name,
        probability: stageProbability,
        deals: stageDeals.length,
        value: stageValue,
        weightedValue: stageValue * stageProbability / 100,
      };
    });
    
    return {
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
      },
      stages,
      totals: {
        deals: stages.reduce((sum, s) => sum + s.deals, 0),
        value: stages.reduce((sum, s) => sum + s.value, 0),
        weightedValue: stages.reduce((sum, s) => sum + s.weightedValue, 0),
      },
    };
  });
  
  return {
    totalDeals,
    totalValue,
    weightedValue: Math.round(weightedValue),
    averageDealSize: totalDeals > 0 ? Math.round(totalValue / totalDeals) : 0,
    openDeals: openDeals.length,
    openValue,
    wonDeals: wonDeals.length,
    wonValue,
    lostDeals: lostDeals.length,
    lostValue,
    winRate: Math.round(winRate * 10) / 10,
    periods,
    pipelines,
    dateRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  };
}

/**
 * Generate period breakdowns
 */
function generatePeriods(
  allDeals: Array<{
    value: number | null;
    status: string;
    stageProbability: number;
    expectedCloseDate: Date | null;
  }>,
  startDate: Date,
  endDate: Date,
  periodType: 'monthly' | 'quarterly'
): ForecastPeriod[] {
  const periods: ForecastPeriod[] = [];
  
  if (periodType === 'monthly') {
    const current = new Date(startDate);
    while (current <= endDate) {
      const periodStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);
      
      const periodDeals = allDeals.filter(d => {
        if (!d.expectedCloseDate) return false;
        return d.expectedCloseDate >= periodStart && d.expectedCloseDate <= periodEnd;
      });
      
      const totalValue = periodDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const wonValue = periodDeals.filter(d => d.status === 'won').reduce((sum, d) => sum + (d.value || 0), 0);
      const lostValue = periodDeals.filter(d => d.status === 'lost').reduce((sum, d) => sum + (d.value || 0), 0);
      const openValue = periodDeals.filter(d => d.status === 'open').reduce((sum, d) => sum + (d.value || 0), 0);
      
      const weightedValue = periodDeals.reduce((sum, d) => {
        if (d.status === 'won') return sum + (d.value || 0);
        if (d.status === 'lost') return sum;
        return sum + ((d.value || 0) * d.stageProbability / 100);
      }, 0);
      
      periods.push({
        period: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
        startDate: periodStart,
        endDate: periodEnd,
        deals: periodDeals.length,
        totalValue,
        weightedValue: Math.round(weightedValue),
        wonValue,
        lostValue,
        openValue,
      });
      
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    // Quarterly
    const current = new Date(startDate);
    while (current <= endDate) {
      const quarter = Math.floor(current.getMonth() / 3);
      const periodStart = new Date(current.getFullYear(), quarter * 3, 1);
      const periodEnd = new Date(current.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      
      const periodDeals = allDeals.filter(d => {
        if (!d.expectedCloseDate) return false;
        return d.expectedCloseDate >= periodStart && d.expectedCloseDate <= periodEnd;
      });
      
      const totalValue = periodDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const wonValue = periodDeals.filter(d => d.status === 'won').reduce((sum, d) => sum + (d.value || 0), 0);
      const lostValue = periodDeals.filter(d => d.status === 'lost').reduce((sum, d) => sum + (d.value || 0), 0);
      const openValue = periodDeals.filter(d => d.status === 'open').reduce((sum, d) => sum + (d.value || 0), 0);
      
      const weightedValue = periodDeals.reduce((sum, d) => {
        if (d.status === 'won') return sum + (d.value || 0);
        if (d.status === 'lost') return sum;
        return sum + ((d.value || 0) * d.stageProbability / 100);
      }, 0);
      
      periods.push({
        period: `Q${quarter + 1} ${current.getFullYear()}`,
        startDate: periodStart,
        endDate: periodEnd,
        deals: periodDeals.length,
        totalValue,
        weightedValue: Math.round(weightedValue),
        wonValue,
        lostValue,
        openValue,
      });
      
      current.setMonth(current.getMonth() + 3);
    }
  }
  
  return periods;
}

/**
 * Get quick forecast metrics (for dashboard widget)
 */
export async function getQuickForecast(
  workspaceId: string
): Promise<{
  thisMonth: { deals: number; value: number; weighted: number };
  thisQuarter: { deals: number; value: number; weighted: number };
  thisYear: { deals: number; value: number; weighted: number };
  winRate: number;
  avgDealSize: number;
  topPipeline: { name: string; value: number } | null;
}> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
  
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  // Get all deals for the year
  const rawYearDeals = await db.query.deals.findMany({
    where: and(
      eq(deals.workspaceId, workspaceId),
      gte(deals.expectedCloseDate, yearStart),
      lte(deals.expectedCloseDate, yearEnd)
    ),
    with: {
      stage: true,
      pipeline: true,
    },
  });
  
  // Map deals with computed status
  const yearDeals = rawYearDeals.map(d => ({
    ...d,
    status: getDealStatus({ stage: d.stage as string, stage_rel: d.stage }),
    stageProbability: d.stage?.probability ?? d.probability ?? 50,
  }));

  // Calculate metrics for each period
  const calcMetrics = (dealsInPeriod: typeof yearDeals) => {
    const value = dealsInPeriod.reduce((sum, d) => sum + (d.value || 0), 0);
    const weighted = dealsInPeriod.reduce((sum, d) => {
      if (d.status === 'won') return sum + (d.value || 0);
      if (d.status === 'lost') return sum;
      return sum + ((d.value || 0) * d.stageProbability / 100);
    }, 0);
    return { deals: dealsInPeriod.length, value, weighted: Math.round(weighted) };
  };

  const monthDeals = yearDeals.filter(d => {
    if (!d.expectedCloseDate) return false;
    return d.expectedCloseDate >= monthStart && d.expectedCloseDate <= monthEnd;
  });

  const quarterDeals = yearDeals.filter(d => {
    if (!d.expectedCloseDate) return false;
    return d.expectedCloseDate >= quarterStart && d.expectedCloseDate <= quarterEnd;
  });

  // Win rate calculation
  const closedDeals = yearDeals.filter(d => d.status === 'won' || d.status === 'lost');
  const wonDeals = yearDeals.filter(d => d.status === 'won');
  const winRate = closedDeals.length > 0 
    ? Math.round((wonDeals.length / closedDeals.length) * 100) 
    : 0;

  // Average deal size
  const totalValue = yearDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const avgDealSize = yearDeals.length > 0 ? Math.round(totalValue / yearDeals.length) : 0;

  // Top pipeline
  const pipelineValues = new Map<string, { name: string; value: number }>();
  for (const deal of yearDeals.filter(d => d.status === 'open')) {
    if (deal.pipeline) {
      const existing = pipelineValues.get(deal.pipelineId || '') || { name: deal.pipeline.name, value: 0 };
      existing.value += deal.value || 0;
      pipelineValues.set(deal.pipelineId || '', existing);
    }
  }
  
  let topPipeline: { name: string; value: number } | null = null;
  let maxValue = 0;
  for (const [, data] of pipelineValues) {
    if (data.value > maxValue) {
      maxValue = data.value;
      topPipeline = data;
    }
  }

  return {
    thisMonth: calcMetrics(monthDeals),
    thisQuarter: calcMetrics(quarterDeals),
    thisYear: calcMetrics(yearDeals),
    winRate,
    avgDealSize,
    topPipeline,
  };
}
