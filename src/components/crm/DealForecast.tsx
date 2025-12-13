"use client";

/**
 * DealForecast - Deal forecasting visualization component
 * 
 * Shows:
 * - Period selector (monthly/quarterly)
 * - Key metrics (total value, weighted value, win rate, avg deal size)
 * - Pipeline breakdown by stage
 * - Period-over-period trends
 */

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Percent,
  PieChart,
  RefreshCw,
  Calendar,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Format currency (cents to dollars)
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Format compact number
function formatCompact(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

interface ForecastPeriod {
  period: string;
  startDate: string;
  endDate: string;
  deals: number;
  totalValue: number;
  weightedValue: number;
  wonValue: number;
  lostValue: number;
  openValue: number;
}

interface PipelineStage {
  id: string;
  name: string;
  probability: number;
  deals: number;
  value: number;
  weightedValue: number;
}

interface PipelineForecast {
  pipeline: {
    id: string;
    name: string;
  };
  stages: PipelineStage[];
  totals: {
    deals: number;
    value: number;
    weightedValue: number;
  };
}

interface ForecastSummary {
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
  averageDealSize: number;
  openDeals: number;
  openValue: number;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  lostValue: number;
  winRate: number;
  periods: ForecastPeriod[];
  pipelines: PipelineForecast[];
  dateRange: {
    start: string;
    end: string;
  };
}

interface DealForecastProps {
  className?: string;
}

export default function DealForecast({ className }: DealForecastProps) {
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly">("monthly");
  
  // Fetch forecast data
  const { data: forecast, isLoading, mutate } = useSWR<ForecastSummary>(
    `/api/crm/forecast?periodType=${periodType}`,
    fetcher
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Forecast Data</h3>
          <p className="text-sm text-muted-foreground">
            Add deals with expected close dates to see forecasting.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Deal Forecast
          </h2>
          <p className="text-sm text-muted-foreground">
            Revenue projections based on pipeline and win probability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodType} onValueChange={(v) => setPeriodType(v as "monthly" | "quarterly")}>
            <SelectTrigger className="w-36">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(forecast.totalValue)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {forecast.totalDeals} deals total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weighted Value</p>
                <p className="text-2xl font-bold">{formatCurrency(forecast.weightedValue)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on stage probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{forecast.winRate}%</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <Percent className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {forecast.wonDeals} won / {forecast.wonDeals + forecast.lostDeals} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                <p className="text-2xl font-bold">{formatCurrency(forecast.averageDealSize)}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {forecast.openDeals} deals open
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deal Status Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Deal Status</CardTitle>
          <CardDescription>Overview of deals by outcome</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50/50 border border-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Won</p>
                <p className="text-lg font-semibold">{formatCurrency(forecast.wonValue)}</p>
                <p className="text-xs text-green-700">{forecast.wonDeals} deals</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-lg font-semibold">{formatCurrency(forecast.openValue)}</p>
                <p className="text-xs text-blue-700">{forecast.openDeals} deals</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 border border-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Lost</p>
                <p className="text-lg font-semibold">{formatCurrency(forecast.lostValue)}</p>
                <p className="text-xs text-red-700">{forecast.lostDeals} deals</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {periodType === "monthly" ? "Monthly" : "Quarterly"} Forecast
          </CardTitle>
          <CardDescription>Projected revenue by period</CardDescription>
        </CardHeader>
        <CardContent>
          {forecast.periods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No deals with expected close dates in this range.
            </p>
          ) : (
            <div className="space-y-4">
              {forecast.periods.slice(0, 6).map((period) => {
                const maxValue = Math.max(...forecast.periods.map((p) => p.totalValue));
                const percentage = maxValue > 0 ? (period.totalValue / maxValue) * 100 : 0;
                const weightedPercentage = maxValue > 0 ? (period.weightedValue / maxValue) * 100 : 0;

                return (
                  <div key={period.period} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{period.period}</span>
                        <Badge variant="outline" className="text-xs">
                          {period.deals} deals
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(period.totalValue)}</span>
                        <span className="text-muted-foreground ml-2">
                          ({formatCurrency(period.weightedValue)} weighted)
                        </span>
                      </div>
                    </div>
                    <div className="relative h-3 rounded-full overflow-hidden bg-muted">
                      {/* Total value bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-200 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                      {/* Weighted value bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                        style={{ width: `${weightedPercentage}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Won: {formatCurrency(period.wonValue)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        Open: {formatCurrency(period.openValue)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Lost: {formatCurrency(period.lostValue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Breakdown */}
      {forecast.pipelines.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Pipeline Breakdown
            </CardTitle>
            <CardDescription>Deal value by pipeline stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {forecast.pipelines.map((pipeline) => (
                <div key={pipeline.pipeline.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{pipeline.pipeline.name}</h4>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {pipeline.totals.deals} deals
                      </span>
                      <span className="mx-2">•</span>
                      <span className="font-medium">
                        {formatCurrency(pipeline.totals.value)}
                      </span>
                    </div>
                  </div>
                  
                  {pipeline.stages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No open deals in this pipeline.</p>
                  ) : (
                    <div className="space-y-2">
                      {pipeline.stages.filter((s) => s.deals > 0).map((stage) => {
                        const stagePercentage = pipeline.totals.value > 0
                          ? (stage.value / pipeline.totals.value) * 100
                          : 0;

                        return (
                          <div
                            key={stage.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium truncate">{stage.name}</span>
                                  <Badge variant="soft" tone="neutral" size="sm">
                                    {stage.probability}%
                                  </Badge>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {stage.deals} deal{stage.deals !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <Progress value={stagePercentage} className="h-2" />
                            </div>
                            <div className="text-right min-w-[100px]">
                              <p className="text-sm font-medium">{formatCurrency(stage.value)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(stage.weightedValue)} weighted
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
